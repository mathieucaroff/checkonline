# Design

## Service worker / Window division

### Service worker functional requirements

- Run the **clock**
  - Reconfiguring the clock period while running should produce **no gap** in the connectivity history _this must be tested_
- Run the **connectivity checker** which emits the queries at the rythm of the clock and with respect to the configured reactivity  _the reactivity timeout must be tested_
- Perform the **data collection**

### Tab-window functional requirements

- Display the **connectivity look**
  - The favicon must change when the connectivity is lost or restablished
  - The background of the window must change to red or to black
  - The title of the window must change if distinct titles have been configured
- **History of the day**
  - The connectivity history of the current day is progressively written to an image
  - The finest granularity that can be used is one eigth of a second (125 milliseconds)
  - There is a gap of a pixel between quarter-hours, and a gap of two pixels between hours
  - The local timezone is taken into account
  - The date of the day is displayed in the top left corner of the image
  - Switch to a new day whenever the current day ends
  - For the **primary tab**
    - Save the image of the current day to the localStorage periodically
    - Save it whenever the tab visibility changes to hidden
    - Save it whenever asked to do so by the service worker, and respond once the image has been saved, signal it to the service worker
- **History of the previous days**
  - Display the history of the previous day upon loading the page
  - Allow the user to select any of the available past days via a search-select-box component
  - The day selection must be persisted to the URL hash, but **not** to the localStorage
  - If the selected day is yesterday and the current days ends, the selected day should automatically switch to the next day.
- **Configuration**
  - Host the configuration GUI
  - Save the configuration
  - Display the configuration in the url bar
  - Allow changing the configuration through the url bar
  - Changes to the configuration must take effect immediately
  - Note: if two tabs are open, the configuration must be synced between the two

## Interfaces and specification for the service worker

### Clock

```
createClock(
  period: number,
  punctualityThreshold: number,
  tickCallback: (time: number) => void,
  skipCallback: (time: number, duration: number) => void,
) => {
    setParameters: (period: number, punctualityThreshold: number) => void,
    dispose: () => void
}
```

At each tick, the clock calls `tickCallback`. When the clock runs late, it calls `skipCallback` followed by `tickCallback`. The duration parameter tells how long the skip period is. The clock is considered to be running late, when the lateness exceeds to the punctuality threshold.

### Connectivity checker

```
pingTest(self: Window, targetList: string[], reactivity: number) => Promise<void>

createSlowPingTester(self: Window, targetList: string[]) => { test: (reactivity: number) => Promise<void> }
```

`createSlowPingTester` relies entierly on `pingTest`. Upon creation, it defines the default target to be the first of the targetList.

Upon running a test, it queries the default target and if it exceeds the reactivity timeout it does the following:
- it queries all the other targets simultaneously and signals a loss of connection if the time exceeds the reactivity again
- it changes the default target to the next one in line in the target list.

If the default target or any of the other targets responds in time, it signals that the connection is live. It does so as soon as any response arrives; including if it is the the default target which answers first.

### Data collection

The following data is collected:

- Local timezone
- Time at which the application is opened
- Time at which the application is closed
- Full application configuration
- Set of features used during the session, as a boolean map. The applicable features are the following:
  - Previous day history navigation
  - Updating the settings through the GUI
  - Updating the settings by altering the window hash
  - Updating the settings by loading a URL
- Whether the page was left while the device was online or offline
  - In the offline case, the last received data will be due to the periodic schedule (`"periodic"`) rather than to a visibilityChange to hidden event (`"event"`).

Note: if the user has no internet connection at any point throughout a session, then no data is collected for that session.

The data is sent every minute, as well as each time the visibility of any of any of the opened tabs changes to hidden. The service worker is responsible for all the requests made towards the data collection API: a POST request if no session id is defined and a PUT request otherwise.

The service worker relies on the `iAmHidden` message from the tabs to know when a the visility of a tab changes to hidden. The sending of this message is easily implemented:

```js
window.addEventListener('visibilitychange', async () => {
  if (document.visibilityState  === 'hidden') {
    const registration = await navigator.serviceWorker.ready
    registration.active.postMessage({ type: "iAmHidden" })
  }
})
```


## Interfaces and specification for the service for the tabs

### Connectivity look manager

Besides updating the title when connectivity events occure, the connectivity look manager must update the title when the configuration is changed. See the Configuration section.

Note the service worker is the one in charge of broadcasting connectivity events to all tabs, i.e. to all window clients.

### History of the day

#### Periodically saving the image

The periodicity at which the primary tab must save the image is every **minute**, each time epoch clock reaches a whole minute value. This case can be detected in a well-aligned periodic callback function by comparing `Math.floor(Date.now() / 60_000)` to its previous value on each call.

#### Loading the history image

Keeping an up-to-date image in the case where multiple tabs are open can be tricky. If the current tab turns out to be the primary tab, then it can confidently load the image from the localStorage and start drawing on it.

~~For non-primary tab, they must send a helloNotification to the service worker. The service worker will then send an exportHistoryImageRequest to the primary tab to tell them to export their image to the localStorage. Once done, the primary tab will respond with an exportHistoryImageRequestCompleted message to the service worker, which will then~~

For non-primary tab, they must broadcast a `hello` message to all the clients. The primary tab must react to this message by exporting their history image to the localStorage and follow up by broadcasting a `historyImageSaved` message to all the clients. Once the non-primary tab receives this message they can load the image from the localStorage and start drawing on it.

If the non-primary tab receives no `historyImageSaved` message after five seconds, it should log a warning message to the developer console and broadcast a second `hello` message. If they still do not receive a `historyImageSaved` message after five more seconds, they should log an error message to the developer console and read the history image from the localStorage and start drawing.

#### End of the current day

When the current day ends, the prime tab should save the image of the day to the localStorage and broadcast a `historyImageSaved` message. Then the canvas should be wiped, the frames should be drawn and the tab should start drawing.

The secondary tabs should just wipe the canvas and start drawing right away, discarding their version of the history image of the past day.

### History of previous days

_End of the current day_

When the current day ends, the list of selectable days should be updated to include the ending day. For this end, for the primary tab:

1. The list of saved days should be updated, by reloading it from the localStorage.
2. If the previous day display shows a day other than the current one, then there's nothing more to do. If the previous day display shows the day right before the current one, then it should be switched to displaying the current day, and the select should be set to the current day.

For secondary tabs, the two above operations should be carried upon receiving a `historyImageSaved` message.

If a date with no associated image is selected, the previous-days-canvas should display a canvas should just display an image with only the frame drawn. The date selector should display the non-existing date as being selected. As soon as any other date is selected, it should remove the non-existing date from the options.

### Configuration

Whenever any of the following happens to a tab:

- A tab is loaded with some configuration parameters
- The hash of the URL of a tab is changed and includes some configuration parameters
- The configuration is changed via the GUI

Then the configuration must be saved to the localStorage and must be sent to all browsing contexts via a BroadcastChannel. Note that the service worker relies on the broadcasted message to obtain the configuration and run correctly.

## Internal requirements

### Primary tab

_How do tabs know whether they are the primary tab?_

Upon opening, each tab will request locking the "primary" ressource through the lock API:

```js
let primary = false
navigator.locks.request('checkonline/primary', () => new Promise(() => {
  primary = true

  informTheServiceWorkerThatThisTabIsPrimary()
}))

async function informTheServiceWorkerThatThisTabIsPrimary() {
  const registration = await navigator.serviceWorker.ready
  registration.active.postMessage({ type: "primaryNotification" })
}
```

Since blocked requests are queued, the oldest remaining tab will be the one to become primary whenever the primary tab is closed.

~~The service worker will be informed that this tab is primary through a message of type `primaryNotification` send from this tab.~~

### Switching to a new day

The end of the current day can be detected by comparing the last value of `Math.floor(time / (24 * 3600 * 1000))` to the current one, where `time` has been properly offset to take the timezone into account.

When switching to a new day, both the current day manager and the previous day manager should be informed, in that order.

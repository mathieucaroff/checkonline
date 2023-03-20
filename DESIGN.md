# Design

## Service worker / Window division

### Service worker functional requirements

- Run the **connectivity queries**
- Run the **clock**
  - Reconfiguring the clock while running should produce **no gap**
- Perform the **data collection**

### Window functional requirements

- Display the **connectivity mien** (mien means appearance)
  - The favicon must change when the connectivity is lost or restablished
  - The background of the window must change to red or to black
  - The title of the window must change if distinct titles have been configured
- **History of the day**
  - Display the connectivity history, split-second by split-second
  - Take the local timezone into account
  - Switch to a new day whenever the current day ends
  - For the **primary tab**
    - Save the image of the current day periodically
    - Save it whenever the tab is closed
    - Save it whenever asked to do so by the service worker, and responds once the image has been saved
- **History of the previous days**
  - Something
- **Configuration**
  - Host the configuration GUI
  - Save the configuration
  - Display the configuration in the url bar
  - Allow changing the configuration through the url bar
  - Change to the configuration must take effect immediately
  - Note: if two tabs are open, the configuration must be synced between the two by the service worker

## Interfaces and specification

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

### Data collection

The following data is collected:

- Local timezone
- Time of the day at which the application is opened
- Time of the day at which the application is closed
- Duration between opening and closing the application
- Full application configuration

The data is sent whenever the last tab of the scope is closed. This approach might not be the easiest to implement, but I believe the data it produces is corresponds to the desirable infos. Regarding the implementation, I suggest that the tabs should notify the service worker whenever they are created or closed (using the `"unload"` event), so that the service worker may broadcast the number of clients to all of them (`clients.matchAll({ type: 'window' }).length`)

### Connectivity mien

Besides updating the title when connectivity events occure, the connectivity mien must update the title when the configuration is changed. See the Configuration section.

Note the service worker is the one in charge of broadcasting connectivity events to all tabs, i.e. to all window clients.

### History of the day

### History of previous days

## Internal requirements

### Last open tab

_How does a tab know that it is the last one open?_

Each time a tab is opened or closed (`unload` event), it will send a message to the service worker. Each time the service worker will receive such a message, it will broadcast the current number of window clients to all window clients.

This workflow will involve the following APIs:
- the `ServiceWorker.postMessage` API to send the tab opening/closing events
- the `clients` API to determine the number of window clients
- the Broadcast API to send it to them.

`/!\` Beware the `clients.matchAll({ type: "window" })` call may pick up the closing so the client count may be offset by one for tabCloses events. The behaviour shall be tested in supported navigators.

Best-effort code sample to let tabs know the tab count:

```js
// # 1. Emitting tab-opens and tab-closes events
// [Tab side]
navigator.serviceWorker.ready.then((registration) => {
  registration.active.postMessage({ type: 'tabOpens' })
})




// Service worker side:
self.addEventListener("message", (event) => 
  if (["tabOpens", "tabCloses"].includes(event.data.type)) {}
);
const tabLifetimeChannel = new BroadcastChannel('tabLifetime')
tabLifetimeChannel.addEventListener('message', () => {})
```

### Primary tab

_How does the application determine which tab is the primary tab? More specifically, how do tabs know whether they are primary or secondary?_

Upon being opened, each tab sends a message to the service worker. The service worker finds the client id in `message.source.id` and pushes at the  end of an array. It then broadcasts the number of window clients to all clients.

Upon being closed (`unload` event), each tab sends a message to the service worker. The worker removes the id from the array. If the closed tab was primary, the worker finds the next id in the array and promotes it to primary. This ensures that the primary tab is always the oldest. The worker also broadcasts the number of window clients to all clients again. This way all clients always know the number of currently opened clients. This is useful for the data colection, since the data POST is only run when the last tab closes.
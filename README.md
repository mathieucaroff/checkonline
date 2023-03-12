# Check-online

A simple network connectivity watcher for the browser.

[checkonline.vercel.app](https://checkonline.vercel.app/)
[mathieucaroff.com/checkonline](https://mathieucaroff.com/checkonline/)

## Features

### Connectivity Status

- Continuous connectivity checking
- Choose the check periodicity (0.5s by defalut)
- Choose the reactivity threashold (0.5s by defalut)
- The icon changes to indicate the connectivity status.
- The title of the tab can be made to change with the connectivity status.
- The background of the page changes with the connectivity status.

### Service availability

- The page becomes available offline after it has been loaded once.

### History

- The history of the connectivity status is displayed for the ongoing day and the previous day. Every second of the day is displayed in at least one pixel.
- The history for days further in the past is stored in the local storage of the page, and is accessible via a menu.

### Configuration

- The configuration can be changed through the GUI
- It is saved in the local storage of the browser
- It can be exported and imported as JSON through a dedicated tab

## Frequently asked questions

- Why doesn't the title change by default?
  - Whenever the title is changed, the browser marks the tab with a dot to signal this change to the user (tested in Firefox). This can become bothersome very quickly.


let topWindowID;
let currentWindow;

document.querySelector('form').onsubmit = function onSubmit(event) {
  event.preventDefault();
  mergeWindows();
}

function mergeWindows() {
  chrome.windows.getCurrent({ populate: true }, (mainWindow) => {
    currentWindow = mainWindow;
    topWindowID = currentWindow.id || currentWindow.sessionId;
    return getOtherWindowsIDs()
      .then(getAllTabsInWindow)
      .then(moveTabsToCurrentWindow)
  });
}

function getOtherWindowsIDs() {
  return new Promise((resolve) => {
    chrome.windows.getAll((windows) => {
      const otherWindowsIDs = windows
        .filter((window) => {
          const currentId = window.id || window.sessionId;
          return currentId !== topWindowID;
        })
        .map(returnID);
      return resolve(otherWindowsIDs);
    });
  });
}

function getAllTabsInWindow(otherWindowsIDs) {
  function getTabsByWindowID(id) {
    return new Promise((resolve) => {
      chrome.tabs.getAllInWindow(id, tabsInWindows => resolve(tabsInWindows));
    });
  }
  return Promise.all(otherWindowsIDs.map(id => getTabsByWindowID(id)));
}


function moveTabsToCurrentWindow(tabsInWindows) {
  const promises = tabsInWindows.map(tabs =>
    new Promise((resolve) => {
      const tabsNotInCurrentWindow = tabs.map(returnID);
      const options = {
        windowId: Number(topWindowID),
        index: currentWindow.tabs.length,
      };
      chrome.tabs.move(tabsNotInCurrentWindow, options, resolve);
    })
  );

  return Promise.all(promises);
}


function returnID(window) {
  return window.id || window.sessionId;
}

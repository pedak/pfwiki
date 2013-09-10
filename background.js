// ProFuse Wikipedia Adapter 
// v0.1
// Peter Kalchgruber
// University of Vienna

// adds handler for request
// shows icon in browser bar if update has been found

chrome.extension.onRequest.addListener(function (request, sender) {
	chrome.pageAction.show(sender.tab.id);
});
// Phase 01 bootstrap only. Future lifecycle and secure vault services will live here.
// Reading extension metadata keeps this entry point active without permissions or listeners.
chrome.runtime.getManifest();

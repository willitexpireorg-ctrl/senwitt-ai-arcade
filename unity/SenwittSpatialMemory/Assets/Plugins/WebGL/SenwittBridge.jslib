mergeInto(LibraryManager.library, {
  SenwittUnityReady: function () {
    if (typeof window.senwittUnityReady === 'function') {
      window.senwittUnityReady();
    }
  },

  SenwittUnityComplete: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    if (typeof window.senwittUnityComplete === 'function') {
      window.senwittUnityComplete(json);
    }
  },

  SenwittUnityCancel: function () {
    if (typeof window.senwittUnityCancel === 'function') {
      window.senwittUnityCancel();
    }
  }
});

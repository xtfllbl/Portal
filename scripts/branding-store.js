(function () {
  'use strict';
  // Blob storage accommodates two full-size 2 MB uploads without base64 quota inflation.
  var database;
  function open() {
    if (!database) database = new Promise(function (resolve, reject) {
      var request = indexedDB.open('paywizard.branding.v1', 1);
      request.onupgradeneeded = function () { request.result.createObjectStore('logos'); };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
      request.onblocked = function () { reject(new Error('Logo storage is unavailable.')); };
    });
    return database;
  }
  function transaction(mode, value) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('logos', mode);
        var request = mode === 'readonly' ? tx.objectStore('logos').get('current') : tx.objectStore('logos').put(value, 'current');
        tx.oncomplete = function () { resolve(mode === 'readonly' ? request.result || { header: null, terminal: null } : value); };
        tx.onabort = tx.onerror = function () { reject(tx.error || new Error('Unable to save logos.')); };
      });
    });
  }
  var headerUrl;
  var refreshVersion = 0;
  function refreshHeader() {
    var version = ++refreshVersion;
    return transaction('readonly').then(function (logos) {
      if (version !== refreshVersion) return;
      var img = document.querySelector('.pw-platform-brand img');
      if (!img) return;
      var previous = headerUrl;
      headerUrl = logos.header ? URL.createObjectURL(logos.header.file) : null;
      img.src = headerUrl || 'assets/paywizard-logo-sidebar.png';
      img.alt = headerUrl ? 'System Header Logo' : 'PAYwizard';
      img.classList.toggle('pw-custom-header-logo', Boolean(headerUrl));
      if (previous) URL.revokeObjectURL(previous);
    }).catch(function () { /* Keep the default brand when browser storage is unavailable. */ });
  }
  var channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('paywizard.branding') : null;
  if (channel) channel.onmessage = refreshHeader;
  window.addEventListener('pageshow', refreshHeader);
  window.PaywizardBranding = {
    load: function () { return transaction('readonly'); },
    save: function (logos) {
      return transaction('readwrite', logos).then(function () {
        if (channel) channel.postMessage('saved');
        return refreshHeader();
      });
    }
  };
  refreshHeader();
})();

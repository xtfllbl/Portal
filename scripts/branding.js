(function () {
  'use strict';
  var tabs = Array.from(document.querySelectorAll('[data-branding-tab]'));
  function selectTab(name) {
    tabs.forEach(function (tab) {
      var selected = tab.dataset.brandingTab === name;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(tab.dataset.brandingTab); });
    tab.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      selectTab(next.dataset.brandingTab);
      next.focus();
    });
  });
  if (location.hash === '#email') selectTab('email');

  var panel = document.getElementById('logo-panel');
  var saveButton = panel.querySelector('[data-save-logos]');
  var status = panel.querySelector('[data-logo-status]');
  var sections = Array.from(panel.querySelectorAll('[data-logo]'));
  var draft = { header: null, terminal: null };
  var previewUrls = {};
  var pending = {};
  var ready = false;
  var saving = false;
  var dirty = false;
  var store;

  function controls() {
    var busy = !ready || saving || Object.values(pending).some(Boolean);
    panel.querySelectorAll('button').forEach(function (button) { button.disabled = busy; });
    saveButton.disabled = busy || !dirty;
  }
  function render(section) {
    var key = section.dataset.logo;
    var logo = draft[key];
    if (previewUrls[key]) URL.revokeObjectURL(previewUrls[key]);
    var image = section.querySelector('[data-preview]');
    image.hidden = !logo;
    if (logo) {
      previewUrls[key] = URL.createObjectURL(logo.file);
      image.src = previewUrls[key];
    } else {
      image.removeAttribute('src');
      delete previewUrls[key];
    }
    section.querySelector('[data-empty]').hidden = Boolean(logo);
    section.querySelector('[data-file-row]').hidden = !logo;
    section.querySelector('[data-filename]').textContent = logo ? logo.name : '';
  }
  function error(section, message) {
    var el = section.querySelector('[data-error]');
    el.textContent = message;
    el.hidden = !message;
  }
  async function upload(section, files) {
    if (!ready || saving || Object.values(pending).some(Boolean) || !files.length) return;
    error(section, '');
    if (files.length !== 1) return error(section, 'Upload one image at a time.');
    var file = files[0];
    if (!['image/png', 'image/jpeg'].includes(file.type)) return error(section, 'Choose a JPG or PNG image.');
    if (file.size > 2 * 1024 * 1024) return error(section, 'The image must not exceed 2 MB.');
    var key = section.dataset.logo;
    pending[key] = true;
    controls();
    var url = URL.createObjectURL(file);
    try {
      var image = new Image();
      image.src = url;
      await image.decode();
      draft[key] = { file: file, name: file.name };
      render(section);
      dirty = true;
      status.textContent = 'Unsaved changes';
    } catch (_) {
      error(section, 'This image could not be read. Choose a valid JPG or PNG.');
    } finally {
      URL.revokeObjectURL(url);
      pending[key] = false;
      controls();
    }
  }
  sections.forEach(function (section) {
    var input = section.querySelector('[data-file]');
    var zone = section.querySelector('[data-upload]');
    [zone, section.querySelector('[data-replace]')].forEach(function (button) {
      button.addEventListener('click', function () { input.click(); });
    });
    input.addEventListener('change', function () {
      upload(section, Array.from(input.files));
      input.value = '';
    });
    zone.addEventListener('dragover', function (event) {
      event.preventDefault();
      if (!zone.disabled) zone.classList.add('is-dragging');
    });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-dragging'); });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('is-dragging');
      upload(section, Array.from(event.dataTransfer.files));
    });
    section.querySelector('[data-remove]').addEventListener('click', function () {
      draft[section.dataset.logo] = null;
      error(section, '');
      render(section);
      dirty = true;
      status.textContent = 'Unsaved changes';
      controls();
    });
  });
  saveButton.addEventListener('click', async function () {
    saving = true;
    status.textContent = 'Saving…';
    controls();
    try {
      await store.save(draft);
      dirty = false;
      status.textContent = 'Saved';
    } catch (_) {
      status.textContent = 'Unable to save. Please try again.';
    } finally {
      saving = false;
      controls();
    }
  });
  window.addEventListener('beforeunload', function (event) {
    if (dirty || saving) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  window.paywizardBrandingReady.then(async function (branding) {
    store = branding;
    draft = await store.load();
    sections.forEach(render);
    ready = true;
    status.textContent = '';
    controls();
  }).catch(function () {
    status.textContent = 'Logo storage is unavailable. Reload to try again.';
  });
})();

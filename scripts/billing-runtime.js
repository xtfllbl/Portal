(function () {
  'use strict';
  const store = window.PaywizardBillingStore;
  const mount = document.querySelector('main') || document.body;
  const bar = document.createElement('div'); bar.className = 'billing-runtime';
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Demo settings';
  bar.append(button);
  const heading = mount.querySelector('.billing-page-header, .payments-heading-actions');
  if (heading) heading.append(bar); else mount.prepend(bar);
  const dialog = document.createElement('dialog'); dialog.className = 'billing-runtime-dialog';
  dialog.setAttribute('aria-labelledby', 'billingRuntimeTitle');
  dialog.innerHTML = '<form><h2 id="billingRuntimeTitle">Demo settings</h2><label>Mode<select id="billingRuntimeMode"><option value="local">Local demo</option><option value="shared">Shared demo</option></select></label><p id="billingRuntimeHelp"></p><label id="billingRuntimeOriginField">Shared site URL<input id="billingRuntimeOrigin" type="url" placeholder="https://your-site.vercel.app"></label><label id="billingRuntimeKeyField">Management key<input id="billingRuntimeKey" type="password" autocomplete="current-password"></label><p id="billingRuntimeError" role="alert"></p><div class="billing-runtime-actions"><button type="button" id="billingRuntimeCancel">Cancel</button><button type="submit" id="billingRuntimeSave">Connect</button></div></form>';
  document.body.append(dialog);
  const $ = id => document.getElementById(id);
  function fields() {
    const local = $('billingRuntimeMode').value === 'local';
    $('billingRuntimeOriginField').hidden = local; $('billingRuntimeKeyField').hidden = local;
    $('billingRuntimeSave').textContent = local ? 'Use Local Demo' : 'Connect';
    $('billingRuntimeHelp').textContent = local ? 'Saved in this browser. Payments on other devices do not update this demo.' : 'Payments and billing records are shared across devices.';
  }
  button.onclick = () => {
    const config = store.settings();
    $('billingRuntimeMode').value = store.mode === 'local' ? 'local' : 'shared';
    $('billingRuntimeOrigin').value = config.origin || (store.mode === 'shared' ? location.origin : '');
    $('billingRuntimeKey').value = ''; $('billingRuntimeError').textContent = ''; fields(); dialog.showModal();
  };
  $('billingRuntimeMode').onchange = fields;
  $('billingRuntimeCancel').onclick = () => dialog.close();
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault(); $('billingRuntimeSave').disabled = true; $('billingRuntimeCancel').disabled = true;
    try {
      store.configure({mode:$('billingRuntimeMode').value, origin:$('billingRuntimeOrigin').value});
      await store.initialize($('billingRuntimeKey').value);
      $('billingRuntimeKey').value = ''; dialog.close(); window.dispatchEvent(new Event('billing-reconnect'));
    } catch (error) { $('billingRuntimeError').textContent = error.message; }
    finally { $('billingRuntimeSave').disabled = false; $('billingRuntimeCancel').disabled = false; refresh(); }
  };
  dialog.addEventListener('cancel', event => { if ($('billingRuntimeSave').disabled) event.preventDefault(); });
  dialog.addEventListener('close', () => button.focus());
  function refresh() { button.textContent = store.mode === 'local' ? 'Local demo · Settings' : store.mode === 'shared' ? 'Shared demo · Settings' : 'Demo settings'; }
  window.addEventListener('billing-mode', refresh); refresh();
})();

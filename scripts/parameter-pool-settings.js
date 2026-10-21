(function () {
  'use strict';
  if (window.PaywizardPortalAccess?.profile !== 'maintain') return;
  const pool = window.PaywizardParameterPool, $ = id => document.getElementById(id);
  const context = new URLSearchParams(location.search);
  const owner = { merchantId: context.get('merchantId') || '', storeId: context.get('storeId') || '', tci: context.get('tci') || '' };
  const detailPage = context.get('detailPage') === '5.merchant_detail_no_store_iso.html' ? '5.merchant_detail_no_store_iso.html' : '5.merchant_detail_iso.html';
  document.querySelectorAll('a[href="5.merchant_detail_iso.html"]').forEach(link => { link.href = detailPage + (detailPage.includes('no_store') ? `?merchantId=${encodeURIComponent(owner.merchantId)}` : ''); });
  let terminal;
  try { terminal = pool.terminalFor(pool.read(), owner); } catch (_) { return; }
  if (!terminal) return;
  const schema = PROCESSOR_PARAMETER_SCHEMA['NUVEI UPT'];
  const host = $('processorParams');
  const set = host.querySelector('.param-set[data-processor="NUVEI UPT"]');
  const fields = () => [...set.querySelectorAll('.parameter-value')];
  let editing = false, pending = false;
  const section = document.createElement('div'); section.className = 'pp-switch-section';
  section.innerHTML = '<div class="pp-switch-bar" id="poolSourceBar"><div class="pp-preset-identity"><span class="pp-preset-marker" id="switchSource"><span class="material-symbols-rounded" aria-hidden="true">inventory_2</span>Preconfigured Parameters</span><span id="switchSetName" class="pp-preset-name"></span></div><div class="pp-switch-actions"><button type="button" class="btn" id="beginParameterSwitch">Switch to Merchant Parameters</button><button type="button" class="btn" id="cancelParameterSwitch" hidden>Cancel Switch</button></div></div><p id="switchStatus" class="pp-note" role="status"></p><div id="switchError" class="pp-switch-error" role="alert" tabindex="-1" hidden></div>';
  host.querySelector('.processor-params-head').after(section);
  host.querySelector('.processor-params-head p')?.remove();
  host.querySelector('.processor-params-head').append($('cancelParameterSwitch'));
  function error(message) { section.hidden = false; $('switchError').textContent = message; $('switchError').hidden = false; $('switchError').scrollIntoView({ block: 'center' }); $('switchError').focus({ preventScroll: true }); }
  function values() { return Object.fromEntries(fields().map(input => [input.dataset.parameterKey, input.value])); }
  function fill(parameters) {
    fields().forEach(input => {
      input.value = parameters[input.dataset.parameterKey] ?? '';
      input.closest('.field')?.querySelectorAll('.param-segment').forEach(button => { const selected = button.dataset.value === input.value; button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected)); });
    });
  }
  function render() {
    const state = pool.read(); terminal = pool.terminalFor(state, owner);
    const pooled = terminal.parameterSource === 'pool';
    const request = state.switchRequests.find(row => row.tci === owner.tci && row.merchantId === owner.merchantId && row.storeId === owner.storeId && row.status === 'submitted');
    pending = !!request;
    const locked = pending || (pooled && !editing);
    fields().forEach(input => {
      if (input.tagName === 'SELECT') input.disabled = locked; else input.readOnly = locked;
      input.closest('.field')?.querySelectorAll('.param-segment').forEach(button => { button.disabled = locked; });
    });
    set.classList.toggle('pp-pool-readonly', locked);
    // Processor/model changes would invalidate the current parameter source. App version remains independent.
    for (const id of ['device-processor', 'device-model', 'device-terminal-scenario', 'device-provision-toggle']) if ($(id)) $(id).disabled = true;
    host.querySelector('.processor-template-row').hidden = pooled;
    for (const id of ['saveTemplateBtn', 'openCloneConfigBtn']) if ($(id)) $(id).disabled = locked;
    $('beginParameterSwitch').hidden = !pooled || editing || pending;
    $('cancelParameterSwitch').hidden = !editing || pending;
    $('redeployBtn').disabled = pending;
    const showPoolSource = pooled && !editing && !pending;
    $('poolSourceBar').hidden = !showPoolSource;
    const usage = state.usages.find(row => row.id === (terminal.usageId || terminal.lastPoolUsageId));
    $('switchSetName').textContent = showPoolSource && usage ? usage.resourceName : '';
    section.hidden = !showPoolSource && !pending && $('switchError').hidden;
    $('switchStatus').hidden = !pending;
    $('switchStatus').textContent = pending ? 'Waiting for terminal confirmation. The current parameter set remains in use.' : '';
    return request;
  }
  function validate() {
    if (pending) { error('Wait for the terminal to confirm the current deployment.'); return false; }
    if (!editing && terminal.parameterSource === 'pool') return true;
    try {
      pool.validateParameters(values(), schema);
      if (editing && (!$('device-tpn').readOnly || !$('device-tpn').value.trim())) throw new Error('Assign a terminal to this TCI before switching parameters.');
      $('switchError').hidden = true; return true;
    } catch (cause) {
      const definition = schema.flatMap(group => group[1]).find(field => cause.message.startsWith(field[1]));
      const input = definition && fields().find(field => field.dataset.parameterKey === definition[0]);
      const panel = input?.closest('.param-panel');
      if (panel) set.querySelector(`[aria-controls="${panel.id}"]`)?.click();
      error(cause.message); return false;
    }
  }
  const readinessDialog = document.createElement('dialog');
  readinessDialog.className = 'confirm-dialog pp-switch-readiness';
  readinessDialog.id = 'switchReadinessDialog';
  readinessDialog.setAttribute('aria-labelledby', 'switchReadinessTitle');
  readinessDialog.setAttribute('aria-describedby', 'switchReadinessQuestion switchReadinessConsequence');
  readinessDialog.innerHTML = '<div class="confirm-dialog-head"><h3 class="confirm-dialog-title" id="switchReadinessTitle">Switch to Merchant Parameters</h3></div><div class="confirm-summary"><p id="switchReadinessQuestion">Have you received the merchant’s official payment parameters?</p><p id="switchReadinessConsequence">After you submit the new parameters and they take effect, the current parameter set will enter <strong>Awaiting Settlement</strong>. It can be reused only after settlement is confirmed.</p></div><div class="confirm-dialog-actions"><button type="button" class="btn secondary" id="cancelSwitchReadiness">Cancel</button><button type="button" class="btn primary" id="confirmSwitchReadiness">Yes, Continue Editing</button></div>';
  document.body.append(readinessDialog);
  $('beginParameterSwitch').addEventListener('click', () => { readinessDialog.showModal(); $('cancelSwitchReadiness').focus(); });
  $('cancelSwitchReadiness').addEventListener('click', () => readinessDialog.close());
  readinessDialog.addEventListener('close', () => { if (!editing) $('beginParameterSwitch').focus(); });
  readinessDialog.addEventListener('click', event => {
    const rect = readinessDialog.getBoundingClientRect();
    if (event.target === readinessDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) readinessDialog.close();
  });
  $('confirmSwitchReadiness').addEventListener('click', () => {
    const current = pool.terminalFor(pool.read(), owner);
    if (!current || current.parameterSource !== 'pool' || pool.read().switchRequests.some(row => row.usageId === current.usageId && row.status === 'submitted')) {
      readinessDialog.close(); error('The parameter source has changed. Reload the settings.'); return;
    }
    editing = true; readinessDialog.close(); fill(pool.defaults(schema)); $('switchError').hidden = true;
    render(); set.querySelector('.param-tab')?.click(); $('cancelParameterSwitch').focus();
  });
  $('cancelParameterSwitch').addEventListener('click', () => { editing = false; fill(terminal.parameters); $('switchError').hidden = true; render(); $('beginParameterSwitch').focus(); });
  // Static prototype transport only. Replace this scheduled receipt with the real terminal result event in production.
  async function simulateReceipt(request) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      await pool.mutate(state => pool.receiveSwitchResult(state, request.id, 'applied', new Date().toISOString()));
      editing = false; terminal = pool.terminalFor(pool.read(), owner); fill(terminal.parameters); render();
    } catch (cause) { render(); error(cause.message); }
  }
  window.PaywizardParameterSwitch = {
    validate,
    handlesSubmission() { return editing || pending || terminal.parameterSource === 'merchant'; },
    prepareConfirmation() {
      let notice = $('switchConfirmNotice');
      if (notice) notice.hidden = !editing;
      if (!editing) return;
      if (!notice) { notice = document.createElement('p'); notice.id = 'switchConfirmNotice'; notice.className = 'pp-note'; $('redeployOptionsTitle').parentElement.before(notice); }
      notice.textContent = `New MID: ${values().mid} · TID: ${values().tid}. Once the terminal confirms the change, previous pool transactions become read-only and await settlement.`;
      $('saveDeviceConfirmTitle').textContent = 'Switch to Merchant Parameters';
      $('confirmSaveDeviceBtn').textContent = 'Confirm & Deploy';
      $('redeployPaymentParams').checked = true;
    },
    async submit(closeModal) {
      if (!validate()) { closeModal(); return; }
      if (editing && !$('redeployPaymentParams').checked) { closeModal(); error('Select Redeploy Payment Parameters to submit the switch.'); return; }
      $('confirmSaveDeviceBtn').disabled = true;
      try {
        if (!window.TerminalTransactionCapabilities.form.save(closeModal)) return;
        if (!editing) {
          // Existing merchant edits retain the original deployment interaction.
          await pool.mutate(state => {
            const current = pool.terminalFor(state, owner);
            if (current.parameterSource !== 'merchant') throw new Error('The parameter source has changed. Reload the settings.');
            if ($('redeployPaymentParams').checked) current.parameters = pool.validateParameters(values(), schema);
            current.appVersion = $('processor-version').value;
          });
          closeModal(); alert('Device deployment requested.'); return;
        }
        const request = await pool.mutate(state => {
          pool.terminalFor(state, owner).sn = $('device-tpn').value.trim();
          const result = pool.submitSwitch(state, owner, values(), schema, `switch-${crypto.randomUUID()}`, new Date().toISOString());
          result.appVersion = $('processor-version').value;
          return result;
        });
        closeModal(); render(); void simulateReceipt(request);
      } catch (cause) { closeModal(); error(cause.message); }
      finally { $('confirmSaveDeviceBtn').disabled = false; }
    }
  };
  fill(terminal.parameters);
  const request = render();
  if (request) { fill(request.parameters); void simulateReceipt(request); }
  window.addEventListener('storage', event => { if (event.key === pool.KEY) { try { render(); if (!editing) fill(terminal.parameters); } catch (cause) { error(cause.message); } } });
  window.addEventListener('beforeunload', event => { if (editing && !pending) { event.preventDefault(); event.returnValue = ''; } });
})();

(function () {
  'use strict';
  window.PaywizardAdvertisingTargetPicker = { mount };
  function mount({ host, directory, state, draft, changed }) {
    const D = window.PaywizardAdvertisingDomain;
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let view = 'stores', agent = '', merchant = '', store = '', query = '';
    let visible = [], controls = [];
    let comboboxes = new Map();
    let availability;
    const accounts = type => directory.accounts.filter(node => node.type === type);
    const storeFor = id => directory.account(`store:${id}`);
    const covered = terminal => (draft().targetStores || []).includes(terminal.storeId);
    const chosen = item => view === 'stores' ? draft().targetStores.includes(item.id) : covered(item) || draft().targets.includes(item.sn);
    const blocked = item => view === 'stores' ? availability.stores.get(item.id)?.blocked : availability.terminals.get(item.sn)?.blocked;
    // Existing conflicting selections remain removable; new conflicts cannot be added.
    const canToggle = item => !(view === 'terminals' && covered(item)) && (!blocked(item) || chosen(item));
    const removeButton = (kind, id, name) => `<button type="button" class="ads-target-remove" data-remove-${kind}="${esc(id)}" aria-label="Remove ${kind === 'store' ? 'store' : 'terminal'} ${esc(name)}" title="Remove"><img src="assets/icons/close.svg" alt=""></button>`;
    function assignment(kind, item) {
      const names = ids => ids.map(id => state().campaigns.find(c => c.id === id)?.name || id).join(', ');
      let label = 'Available', tone = '', help = '';
      if (kind === 'store') {
        const a = availability.stores.get(item.id);
        if (a?.blocked) {
          const fullStore = a.storeOwners.some(id => id !== draft().id);
          label = `${fullStore ? 'Store assigned' : `${a.conflicting} / ${a.total} assigned`} · ${names(a.otherOwners)}`;
          tone = 'pending'; help = 'Stop the other campaign before assigning this store.';
        } else if (a?.owners.length) {
          label = a.storeOwners.length ? 'This campaign' : `${a.assigned} / ${a.total} in this campaign`;
          tone = 'live';
        }
      } else {
        const a = availability.terminals.get(item.sn);
        if (a?.blocked) { label = `Assigned · ${names([a.owner])}`; tone = 'pending'; help = 'Stop the other campaign before assigning this terminal.'; }
        else if (covered(item)) label = 'Included by store';
        else if (a?.owner) { label = 'This campaign'; tone = 'live'; }
      }
      return `<span class="ads-assignment ${tone ? `ads-badge ${tone}` : ''}"${help ? ` title="${help}"` : ''}>${esc(label)}</span>`;
    }
    function control(id, label, value, items, all, change) {
      controls.push({ id, value, options: [{ key: '', name: all }, ...items], onChange: next => {
        change(next); render();
        const input = host.querySelector(`#${id}`); input?.focus();
        // Keep the committed selection collapsed when focus returns after rendering.
        comboboxes.get(id)?.close();
      } });
      return `<div class="ads-target-field"><label for="${id}">${label}</label><div class="ads-combobox" data-combobox="${id}"><input id="${id}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" autocomplete="off" spellcheck="false"><button type="button" tabindex="-1" aria-label="Show ${label.toLowerCase()} options"><img src="assets/icons/chevron-down.svg" alt=""></button><div id="${id}-list" role="listbox" aria-label="${label} options" class="ads-combobox-options" hidden></div></div></div>`;
    }
    function selectedTable(title, headings, rows) {
      return `<section class="ads-selected-group"><h4>${title}</h4><div class="ads-target-table-wrap" role="region" aria-label="${title}" tabindex="0"><table class="ads-target-table ads-selected-table"><thead><tr>${headings.map(h => `<th>${h}</th>`).join('')}<th><span class="ads-sr-only">Remove</span></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
    }
    function selectedContent(c, explicit, allTerminals) {
      const term = query.trim().toLowerCase();
      const stores = c.targetStores.map(id => storeFor(id) || { id, name: id }).filter(n => `${n.name} ${directory.account(n.parentKey)?.name || ''}`.toLowerCase().includes(term));
      const terminals = explicit.map(sn => state().terminals.find(t => t.sn === sn) || { sn, name: sn }).filter(t => `${t.name} ${t.sn} ${t.store || ''}`.toLowerCase().includes(term));
      const storeRows = stores.map(n => `<tr><td>${esc(n.name)}</td><td data-label="Assignment">${assignment('store', n)}</td><td data-label="Merchant">${esc(directory.account(n.parentKey)?.name || '—')}</td><td data-label="Coverage"><span class="ads-badge" title="Includes current and future terminals in this store">All terminals (${allTerminals.filter(t => t.storeId === n.id).length})</span></td><td>${removeButton('store', n.id, n.name)}</td></tr>`).join('');
      const terminalRows = terminals.map(t => `<tr><td>${esc(t.name)}</td><td data-label="Assignment">${assignment('terminal', t)}</td><td class="ads-target-sn" data-label="SN">${esc(t.sn)}</td><td data-label="Store">${esc(t.store || '—')}</td><td>${removeButton('sn', t.sn, t.name)}</td></tr>`).join('');
      return (storeRows ? selectedTable(`Stores (${stores.length})`, ['Store', 'Assignment', 'Merchant', 'Coverage'], storeRows) : '') + (terminalRows ? selectedTable(`Terminals (${terminals.length})`, ['Terminal', 'Assignment', 'SN', 'Store'], terminalRows) : '') || `<div class="ads-empty">${query ? 'No matching selections.' : 'No targets selected.'}</div>`;
    }
    function invalidSelection() {
      const c = draft();
      const available = state().terminals;
      return c.targetStores.some(id => !accounts('store').some(n => n.id === id)) || c.targets.some(sn => !available.some(t => t.sn === sn));
    }
    function validateSelection() {
      if (!invalidSelection()) return true;
      render();
      const error = host.querySelector('#adsTargetSelectionError');
      error.scrollIntoView({ block: 'center' }); error.focus({ preventScroll: true });
      return false;
    }
    function render() {
      const c = draft(); if (!c) return;
      c.targetStores ||= []; controls = [];
      availability = D.targetAvailability(state(), c);
      const merchants = accounts('merchant').filter(n => !agent || n.lineageKeys.includes(agent));
      const stores = accounts('store').filter(n => (!agent || n.lineageKeys.includes(agent)) && (!merchant || n.lineageKeys.includes(merchant)));
      const allTerminals = state().terminals;
      const terms = allTerminals.filter(t => (!agent || t.accountKeys?.includes(agent)) && (!merchant || t.accountKeys?.includes(merchant)) && (!store || t.accountKeys?.includes(store)));
      const rows = view === 'stores' ? stores.map(n => ({ ...n, merchant: directory.account(n.parentKey)?.name || '', count: allTerminals.filter(t => t.storeId === n.id).length })) : terms;
      const term = query.trim().toLowerCase();
      visible = rows.filter(n => !term || `${n.name} ${n.sn || ''} ${n.merchant} ${n.store || ''}`.toLowerCase().includes(term));
      const selectable = visible.filter(canToggle);
      const checkedCount = selectable.filter(chosen).length;
      const explicit = c.targets.filter(sn => !covered(state().terminals.find(t => t.sn === sn) || {}));
      const selectedCount = c.targetStores.length + explicit.length;
      const coverage = D.resolveTargets(c, allTerminals).filter(sn => allTerminals.some(t => t.sn === sn)).length;
      document.getElementById('targetCount').textContent = `${coverage} terminal${coverage === 1 ? '' : 's'} covered`;
      const checkbox = (item, index) => `<input type="checkbox" data-target-index="${index}" aria-label="Select ${esc(item.name)}" aria-describedby="adsTargetAssignment-${index}" ${chosen(item) ? 'checked' : ''} ${!canToggle(item) ? 'disabled' : ''}>`;
      const body = visible.map((item, index) => `<tr class="${chosen(item) ? 'is-selected' : ''}"><td>${checkbox(item, index)}</td><td>${esc(item.name)}</td><td class="ads-assignment-cell" id="adsTargetAssignment-${index}" data-label="Assignment">${assignment(view === 'stores' ? 'store' : 'terminal', item)}</td>${view === 'stores' ? `<td data-label="Merchant">${esc(item.merchant)}</td><td data-label="Terminals">${item.count}</td>` : `<td class="ads-target-sn" data-label="SN">${esc(item.sn)}</td><td data-label="Store">${esc(item.store)}</td>`}</tr>`).join('');
      const invalid = invalidSelection();
      const pending = (state().targetConflicts || []).filter(item => item.campaignId === c.id);
      const filters = view === 'selected' ? '' : `<div class="ads-target-filters">${accounts('agent').length ? control('adsTargetAgent', 'Agent', agent, accounts('agent'), 'All agents', next => { agent = next; merchant = ''; store = ''; }) : ''}${accounts('merchant').length ? control('adsTargetMerchant', 'Merchant', merchant, merchants, 'All merchants', next => { merchant = next; store = ''; }) : ''}${view === 'terminals' ? control('adsTargetStore', 'Store', store, stores, 'All stores', next => { store = next; }) : ''}</div>`;
      const table = `<div class="ads-target-table-wrap" role="region" aria-label="${view === 'stores' ? 'Stores' : 'Terminals'} selection" tabindex="0"><table class="ads-target-table ads-target-candidates"><thead><tr><th><input id="adsTargetAll" type="checkbox" aria-label="Select all displayed ${view}" ${selectable.length && checkedCount === selectable.length ? 'checked' : ''} ${!selectable.length ? 'disabled' : ''}></th>${(view === 'stores' ? ['Store', 'Assignment', 'Merchant', 'Terminals'] : ['Terminal', 'Assignment', 'SN', 'Store']).map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="5" class="ads-empty">No matching ${view}.</td></tr>`}</tbody></table></div>`;
      host.innerHTML = `<div class="ads-target-tabs" role="tablist" aria-label="Targets">${['stores', 'terminals', 'selected'].map(tab => `<button type="button" role="tab" id="adsTargetTab-${tab}" data-target-view="${tab}" aria-controls="adsTargetPanel" tabindex="${view === tab ? 0 : -1}" aria-selected="${view === tab}">${tab[0].toUpperCase() + tab.slice(1)}${tab === 'selected' ? `<span class="ads-tab-count">${selectedCount}</span>` : ''}</button>`).join('')}</div>
        <div id="adsTargetPanel" role="tabpanel" aria-labelledby="adsTargetTab-${view}">${filters}
        <div class="ads-target-search"><input id="adsTargetSearch" type="search" aria-label="Search ${view}" placeholder="${view === 'stores' ? 'Search stores' : view === 'selected' ? 'Search selected stores or terminals' : 'Search terminal or SN'}" value="${esc(query)}">${view === 'selected' ? `<button type="button" id="adsClearTargets" class="ads-text-action" ${!selectedCount ? 'disabled' : ''}>Clear all</button>` : ''}</div>
        ${view === 'selected' ? selectedContent(c, explicit, allTerminals) : table}</div>
        ${invalid ? `<p id="adsTargetSelectionError" class="ads-error" role="alert" tabindex="-1">Some selected stores or terminals are no longer available. Remove them in Selected before saving or publishing.</p>` : ''}
        ${pending.length ? `<p class="ads-error">Target conflicts: ${pending.map(item => `${esc(item.sn)} is assigned to ${esc(state().campaigns.find(campaign => campaign.id === item.otherCampaignId)?.name || item.otherCampaignId)}`).join('; ')}. Stop the existing campaign in Campaigns to release these terminals.</p>` : ''}`;
      const all = host.querySelector('#adsTargetAll');
      if (all) all.indeterminate = checkedCount > 0 && checkedCount < selectable.length;
      comboboxes = new Map(controls.map(config => [config.id, window.PaywizardAdvertisingCombobox.mount(host.querySelector(`[data-combobox="${config.id}"]`), config)]));
    }
    function applySelection(items, checked) {
      const c = draft();
      items = items.filter(item => canToggle(item) && (!checked || !blocked(item)));
      if (view === 'stores') {
        const ids = items.map(n => n.id);
        c.targetStores = checked ? [...new Set([...c.targetStores, ...ids])] : c.targetStores.filter(id => !ids.includes(id));
        c.targets = c.targets.filter(sn => !covered(state().terminals.find(t => t.sn === sn) || {}));
      } else {
        const ids = items.filter(n => !covered(n)).map(n => n.sn);
        c.targets = checked ? [...new Set([...c.targets, ...ids])] : c.targets.filter(sn => !ids.includes(sn));
      }
      changed(); render();
    }
    host.addEventListener('input', event => {
      event.stopPropagation();
      const input = event.target, id = input.id;
      if (id === 'adsTargetSearch') { query = input.value; const pos = input.selectionStart; render(); const field = host.querySelector('#adsTargetSearch'); field.focus(); field.setSelectionRange(pos, pos); }
      else if (id === 'adsTargetAll') { applySelection(visible, input.checked); host.querySelector('#adsTargetAll')?.focus(); }
      else if (input.dataset.targetIndex !== undefined) { const index = Number(input.dataset.targetIndex); applySelection([visible[index]], input.checked); host.querySelector(`[data-target-index="${index}"]`)?.focus(); }
    });
    function switchView(next) { view = next; query = ''; render(); host.querySelector(`[data-target-view="${view}"]`).focus(); }
    host.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      event.preventDefault(); event.stopPropagation();
      if (button.dataset.targetView) switchView(button.dataset.targetView);
      else {
        if (button.id === 'adsClearTargets') { draft().targets = []; draft().targetStores = []; }
        else if (button.dataset.removeStore) draft().targetStores = draft().targetStores.filter(id => id !== button.dataset.removeStore);
        else if (button.dataset.removeSn) draft().targets = draft().targets.filter(sn => sn !== button.dataset.removeSn);
        else return;
        const label = button.getAttribute('aria-label');
        const removals = [...host.querySelectorAll('.ads-target-remove')];
        const index = removals.indexOf(button);
        changed(); render();
        (host.querySelector(`[aria-label="${CSS.escape(label || '')}"]`) || host.querySelectorAll('.ads-target-remove')[Math.min(index, host.querySelectorAll('.ads-target-remove').length - 1)] || host.querySelector('[aria-selected="true"]')).focus();
      }
    });
    host.addEventListener('keydown', event => {
      if (event.target.id === 'adsTargetSearch' && event.key === 'Enter') event.preventDefault();
      if (event.target.dataset.targetView && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const tabs = ['stores', 'terminals', 'selected']; switchView(tabs[(tabs.indexOf(view) + (event.key === 'ArrowRight' ? 1 : 2)) % 3]); }
    });
    return { render, validateSelection, reset() { view = draft()?.targetStores?.length || !draft()?.targets?.length ? 'stores' : 'terminals'; agent = ''; merchant = ''; store = ''; query = ''; render(); } };
  }
})();

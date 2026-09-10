(() => {
  const E = window.CustomerAlertEvidence, C = window.CustomerAlertEvidenceCases;
  const rows = C.rows(), filters = document.getElementById('filters');
  const condition = document.getElementById('condition'), scope = document.getElementById('scope'), state = document.getElementById('state'), search = document.getElementById('search');
  Object.entries(E.conditions).forEach(([value, label]) => condition.add(new Option(label, value)));
  let page = 0;
  const size = 40;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function render() {
    const query = search.value.trim().toLowerCase();
    const filtered = rows.filter(row => (!condition.value || row.condition === condition.value) && (!scope.value || row.scope === scope.value) && (!state.value || row.state === state.value) && (!query || `${row.id} ${row.scenario} ${row.evidence} ${row.eventEvidence}`.toLowerCase().includes(query)));
    page = Math.min(page, Math.max(0, Math.ceil(filtered.length / size) - 1));
    document.getElementById('count').textContent = `${filtered.length} cases · Page ${page + 1} / ${Math.max(1, Math.ceil(filtered.length / size))}`;
    document.getElementById('previous').disabled = page === 0;
    document.getElementById('next').disabled = (page + 1) * size >= filtered.length;
    document.getElementById('cases').innerHTML = filtered.slice(page * size, (page + 1) * size).map(row => `<tr data-case-id="${escape(row.id)}"><td><code>${escape(row.id)}</code><p>${escape(row.scenario)}</p></td><td>${escape(row.conditionLabel)}</td><td>${escape(row.scope)}</td><td><span class="state ${escape(row.state)}">${row.state === 'None' ? 'No incident' : escape(row.state)}</span></td><td>${escape(row.target)}</td><td>${escape(row.evidence)}</td><td><details><summary>View case</summary><p>${escape(row.stage)}</p><p>${escape(row.action)}</p><p>Observation: ${escape(row.eventEvidence)}</p><ul>${row.details.map(detail => `<li>${escape(detail)}</li>`).join('')}</ul><p>Template: <code>${escape(row.key)}</code></p><pre>${escape(JSON.stringify({parameters: row.parameters, observation: row.observation}, null, 2))}</pre></details></td></tr>`).join('') || '<tr><td colspan="7">No cases found</td></tr>';
  }
  filters.addEventListener('submit', event => event.preventDefault());
  filters.addEventListener('input', () => { page = 0; render(); });
  filters.addEventListener('reset', () => setTimeout(() => { page = 0; render(); }, 0));
  document.getElementById('previous').addEventListener('click', () => { page--; render(); });
  document.getElementById('next').addEventListener('click', () => { page++; render(); });
  render();
})();

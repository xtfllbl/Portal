(function () {
  'use strict';
  const root=document.getElementById('portalContent'),session=window.PaywizardImpersonationSession;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!session){root.innerHTML='<div class="imp-empty"><p>No active impersonation session.</p><a class="imp-button" href="48.impersonate.html">Return to Impersonate</a></div>';return;}
  root.innerHTML=`<section class="imp-portal-entity"><span>${escape(session.user.role)}</span><h2>${escape(session.entity.name)}</h2><p>${escape(session.entity.path)}</p></section><div class="imp-portal-links">${session.modules.map(m=>`<a class="imp-portal-link" href="${escape(m.href)}"><span class="material-symbols-rounded" aria-hidden="true">${m.icon}</span><div><strong>${escape(m.name)}</strong><p>${escape(m.actions.join(', '))}</p></div><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></a>`).join('')}</div>`;
})();

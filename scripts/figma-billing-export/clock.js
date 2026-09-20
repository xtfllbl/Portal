// Isolated export host only: deterministic demo clock and purpose-owned records.
window.exportCaptureHash=location.hash;
window.exportState=new URLSearchParams(location.search).get('state')||'41-01';
const NativeDate=Date;
window.Date=class extends NativeDate {constructor(...v){super(...(v.length?v:['2026-09-20T08:00:00.000Z']));}static now(){return 1789891200000;}};
// No credentials or existing user-origin storage are copied into this isolated host.
localStorage.removeItem('paywizard-billing-local-v1');
localStorage.removeItem('paywizard-billing-setup-v1');
localStorage.setItem('paywizard.portalAccessProfile.v1',window.exportState.startsWith('42-')?'full-service-merchant':'wizarpos');

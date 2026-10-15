(function () {
  'use strict';
  const token=new URLSearchParams(location.search).get('session');
  if(!token)return;
  const key='paywizard.impersonation.handoff.'+token;
  try{
    sessionStorage.removeItem('paywizard.impersonation.session.v1');
    const raw=localStorage.getItem(key);
    localStorage.removeItem(key);
    const session=JSON.parse(raw||'null');
    const age=session?Date.now()-session.createdAt:NaN;
    if(session&&session.id===token&&age>=0&&age<60000)sessionStorage.setItem('paywizard.impersonation.session.v1',JSON.stringify(session));
  }catch(_){}
  history.replaceState(null,'',location.pathname);
})();

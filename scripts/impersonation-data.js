(function (root) {
  'use strict';
  // Fictional prototype accounts. Membership is direct, never inherited.
  const entities = window.PaywizardEntityHierarchy.map(e => ({id:e.id,parentId:e.parentId,type:e.kind==='super_iso'?'provider':e.kind,name:e.name})).concat([
    {id:'provider-northstar',parentId:'',type:'provider',name:'Northstar Payments'},
    {id:'agent-maple',parentId:'provider-northstar',type:'agent',name:'Maple Payments'},
    {id:'agent-maple-east',parentId:'agent-maple',type:'agent',name:'Maple East'},
    {id:'merchant-maple',parentId:'agent-maple-east',type:'merchant',name:'Maple Market'},
    {id:'store-maple',parentId:'merchant-maple',type:'store',name:'Maple Downtown'}
  ]);
  // Use the existing Portal profiles, including the billing-only exception.
  const roles = {
    'Full-Service Provider': {profile:'full-service'},
    'Full-Service Merchant': {profile:'full-service-merchant'},
    'Unattended Store': {profile:'unattended-store'},
    'Billing-only Merchant': {profile:'billing-merchant'},
    'Agent Admin': {profile:'full-service'}
  };
  const users = [
    ['alice','m-tianfu','Alice Chen','Full-Service Merchant'],
    ['brian','m-tianfu','Brian Lee','Billing-only Merchant'],
    ['grace','m-tianfu','Grace Wu','Billing-only Merchant'],
    ['daniel','m-tianfu','Daniel Park','Full-Service Merchant'],
    ['olivia','sp-wizardpos','Olivia Scott','Full-Service Provider'],
    ['ethan','agt-luoqiu','Ethan Lin','Agent Admin'],
    ['mia','s-tianfu-main','Mia Wang','Unattended Store'],
    ['noah','s-tianfu-airport','Noah Kim','Unattended Store'],
    ['emma','m-yameng','Emma Liu','Full-Service Merchant'],
    ['lucas','s-yameng-north','Lucas Wu','Unattended Store'],
    ['ava','s-yameng-central','Ava Zhou','Unattended Store'],
    ['sophia','m-agabae','Sophia Li','Full-Service Merchant'],
    ['james','s-agabae-harbor','James Park','Unattended Store'],
    ['leo','s-agabae-market','Leo Chan','Unattended Store'],
    ['jack','agt-jmsc','Jack Wilson','Agent Admin'],
    ['harper','agent-maple-east','Harper Lee','Agent Admin'],
    ['aria','m-wp-fady','Aria Chen','Full-Service Merchant'],
    ['henry','s-wp-midtown','Henry Li','Unattended Store'],
    ['ella','provider-northstar','Ella Martin','Full-Service Provider'],
    ['liam','agent-maple','Liam Davis','Agent Admin'],
    ['chloe','merchant-maple','Chloe Taylor','Full-Service Merchant'],
    ['owen','store-maple','Owen Brown','Unattended Store']
  ].map(([id,entityId,name,role]) => ({id,entityId,name,role,email:name.toLowerCase().replaceAll(' ','.')+'@example.com'}));
  function lineage(id) {const result=[];let node=entities.find(item=>item.id===id);while(node){result.unshift(node);node=entities.find(item=>item.id===node.parentId);}return result;}
  root.PaywizardImpersonationData = {entities,users,roles,lineage};
})(window);

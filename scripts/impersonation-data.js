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
  const modules = {
    transactions: {name:'Transactions', icon:'credit_card', href:'12.transaction_list.html'},
    devices: {name:'Devices', icon:'devices', href:'2.resellermerchantterminal.html'},
    stores: {name:'Stores', icon:'store', href:'5.merchant_detail_iso.html'},
    advertising: {name:'Advertising', icon:'campaign', href:'45.advertising.html'},
    billing: {name:'Billing & Payments', icon:'receipt_long', href:'42.billing_payments.html'}
  };
  const admin = {transactions:['View','Refund'], devices:['View','Manage'], stores:['View','Edit'], advertising:['View','Publish']};
  const roles = {
    'Merchant Admin': admin,
    'Service Provider Admin': admin,
    'Agent Admin': admin,
    'Store Manager': {transactions:['View','Refund'],devices:['View','Manage'],advertising:['View','Publish']},
    Finance: {transactions:['View','Export','Refund'],billing:['View','Pay']},
    Operations: {devices:['View','Manage'],stores:['View','Edit']}
  };
  const users = [
    ['alice','m-tianfu','Alice Chen','Merchant Admin'],
    ['brian','m-tianfu','Brian Lee','Finance'],
    ['grace','m-tianfu','Grace Wu','Finance'],
    ['daniel','m-tianfu','Daniel Park','Operations'],
    ['olivia','sp-wizardpos','Olivia Scott','Service Provider Admin'],
    ['ethan','agt-luoqiu','Ethan Lin','Agent Admin'],
    ['mia','s-tianfu-main','Mia Wang','Store Manager'],
    ['noah','s-tianfu-airport','Noah Kim','Store Manager'],
    ['emma','m-yameng','Emma Liu','Merchant Admin'],
    ['lucas','s-yameng-north','Lucas Wu','Store Manager'],
    ['ava','s-yameng-central','Ava Zhou','Store Manager'],
    ['sophia','m-agabae','Sophia Li','Merchant Admin'],
    ['james','s-agabae-harbor','James Park','Store Manager'],
    ['leo','s-agabae-market','Leo Chan','Store Manager'],
    ['jack','agt-jmsc','Jack Wilson','Agent Admin'],
    ['harper','agent-maple-east','Harper Lee','Agent Admin'],
    ['aria','m-wp-fady','Aria Chen','Merchant Admin'],
    ['henry','s-wp-midtown','Henry Li','Store Manager'],
    ['ella','provider-northstar','Ella Martin','Service Provider Admin'],
    ['liam','agent-maple','Liam Davis','Agent Admin'],
    ['chloe','merchant-maple','Chloe Taylor','Merchant Admin'],
    ['owen','store-maple','Owen Brown','Store Manager']
  ].map(([id,entityId,name,role]) => ({id,entityId,name,role,email:name.toLowerCase().replaceAll(' ','.')+'@example.com'}));
  function lineage(id) {const result=[];let node=entities.find(item=>item.id===id);while(node){result.unshift(node);node=entities.find(item=>item.id===node.parentId);}return result;}
  root.PaywizardImpersonationData = {entities,users,roles,modules,lineage};
})(window);

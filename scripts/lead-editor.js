(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.PaywizardUptLeadData;
  const params = new URLSearchParams(location.search);
  const id = params.get('leadProcessId');
  const record = id ? data.getByProcessId(id) : null;
  const form = $('leadEditorForm');
  const pickers = {};
  const base = record || { status: 'Not Contacted', attendant: 'Unattended', serialNumbers: [], attachments: [], decisionMaker: {}, secondDecisionMaker: {}, processing: {} };
  let selectedSn = [...base.serialNumbers], attachments = structuredClone(base.attachments), initial = '', leaving = false, dialogAction = null;
  const listUrl = '29.INTL_PSP_merchant_lead_list.html';
  const blocked = Boolean(id && !data.canEdit(record));
  $('page-title').textContent = id ? 'Edit Lead' : 'Add Lead';
  document.title = $('page-title').textContent + ' - PAYwizard';
  $('processLabel').textContent = id ? 'Process ID ' + id : '';

  const regions = {
    'United States of America': ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
    'China': ['Beijing','Shanghai','Guangdong','Zhejiang','Jiangsu','Sichuan'],
    'Canada': ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
    'United Kingdom': ['England','Scotland','Wales','Northern Ireland'],
    'Mexico': ['Jalisco','Mexico City','Nuevo León'],
    'Mongolia': ['Ulaanbaatar'], 'Russian Federation': ['Moscow','Saint Petersburg','Krasnodar Krai'],
    'Indonesia': ['East Java','Jakarta','Bali'], 'Singapore': ['Central Region','East Region','North Region','North-East Region','West Region']
  };
  function options(field, values, value = '') {
    const el = $(field), placeholder = el.options[0].textContent;
    el.replaceChildren(new Option(placeholder, ''));
    const entries = [...new Set([...values, ...(value && !values.includes(value) ? [value] : [])])];
    entries.forEach(text => el.add(new Option(text, text)));
    el.value = value;
    if (pickers[field]) pickers[field].refresh();
  }
  options('pageStyle', ['UPT'], 'UPT'); $('pageStyle').disabled = true;
  options('status', ['Not Contacted','Pitch Scheduled','Negotiation','Successful Pitch','Unsuccessful Pitch','Ineligible'], base.status);
  options('leadResource', ['Direct Traffic','Social Media','Email Marketing','Referral Partners','Trade Shows'], base.leadResource);
  options('partnerName', data.partnerNames, base.partnerName); $('partnerName').disabled = Boolean(id);
  options('country', window.PaywizardPaymentChannelData.options.regions.map(item => item.label), base.country);
  options('attendant', ['Unattended','Attended'], base.attendant);
  options('vendingMachineType', ['Vending Machine (Snacks, Popcorn, Coffee, Cotton Candy, etc.)','Electric Vehicle Charging','Vending Machine (Pharmaceuticals)','Vending Machine (Cosmetics)','Self-Service Laundromat','Claw Machine','Other'], base.vendingMachineType);
  function updateRegion(value = '') {
    const values = [...new Set([...(regions[$('country').value] || []), ...data.getRecords().filter(item => item.country === $('country').value).map(item => item.region).filter(Boolean)])];
    options('region', values, value);
    // Region is optional; retain existing values even outside the local catalog.
    $('region').disabled = !values.length && !value;
    pickers.region?.refresh();
  }
  updateRegion(base.region);
  const simple = ['leadOwner','merchantName','contactName','merchantVertical','email','phone','dispatchTime','arrivalTime','outreachContact','notes','otherServiceType'];
  simple.forEach(key => {
    if (['dispatchTime','arrivalTime'].includes(key) && base[key] && !/^\d{4}-\d{2}-\d{2}$/.test(base[key])) $(key).type = 'text';
    $(key).value = base[key] || '';
  });
  [['decision',base.decisionMaker],['second',base.secondDecisionMaker]].forEach(([prefix, person]) => {
    ['Name','Email','Phone'].forEach(key => { $(prefix+key).value = person?.[key.toLowerCase()] || ''; });
  });
  ['averagePrice','minimumPrice','maximumPrice','monthlyVolume','additionalInformation'].forEach(key => { $(key).value = base.processing?.[key] || ''; });
  $('sameAsMerchant').checked = Boolean(base.sameAsMerchant);
  $('sameAsFirst').checked = Boolean(base.sameAsFirst);
  form.querySelectorAll('select').forEach(select => { pickers[select.id] = window.PaywizardMerchantSelects.mount(select); });
  $('country').addEventListener('change', () => updateRegion());
  function syncPeople() {
    if ($('sameAsMerchant').checked) {
      $('decisionName').value = $('contactName').value;
      $('decisionEmail').value = $('email').value;
      $('decisionPhone').value = $('phone').value;
    }
    if ($('sameAsFirst').checked) ['Name','Email','Phone'].forEach(key => { $('second'+key).value = $('decision'+key).value; });
    ['Name','Email','Phone'].forEach(key => {
      $('decision'+key).readOnly = $('sameAsMerchant').checked;
      $('second'+key).readOnly = $('sameAsFirst').checked;
      $('decision'+key).closest('.field').hidden = $('sameAsMerchant').checked;
      $('second'+key).closest('.field').hidden = $('sameAsFirst').checked;
    });
  }
  form.addEventListener('input', syncPeople);
  $('sameAsMerchant').addEventListener('change', syncPeople);
  $('sameAsFirst').addEventListener('change', syncPeople);
  syncPeople();
  function syncOther() { $('field-otherServiceType').hidden = $('vendingMachineType').value !== 'Other'; }
  $('vendingMachineType').addEventListener('change', syncOther); syncOther();

  function iconButton(label, action) {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', label);
    const icon = document.createElement('span'); icon.className = 'material-symbols-rounded'; icon.textContent = 'close'; icon.setAttribute('aria-hidden','true');
    button.append(icon); button.addEventListener('click', action); return button;
  }
  function renderSn() {
    $('snCount').textContent = selectedSn.length + (id ? ' SNs' : ' selected');
    $('selectedSn').replaceChildren();
    if (!selectedSn.length) { const empty = document.createElement('span'); empty.className='sn-empty'; empty.textContent='No SNs selected'; $('selectedSn').append(empty); }
    selectedSn.forEach(sn => {
      const chip = document.createElement('span'); chip.className = 'sn-chip'; chip.append(document.createTextNode(sn));
      if (!id) chip.append(iconButton('Remove ' + sn, () => { selectedSn = selectedSn.filter(value => value !== sn); renderSn(); $('snSearch').focus(); }));
      $('selectedSn').append(chip);
    });
    $('snPicker').hidden = Boolean(id) || !$('partnerName').value;
    renderSnOptions();
  }
  function renderSnOptions() {
    const host = $('snOptions'); host.replaceChildren();
    if (id) return;
    const matches = data.getSnOptions($('partnerName').value).filter(option => option.sn.toLowerCase().includes($('snSearch').value.toLowerCase()));
    matches.forEach(option => {
      const row = document.createElement('label'); row.className='sn-option';
      const input = document.createElement('input'); input.type='checkbox'; input.value=option.sn; input.checked=selectedSn.includes(option.sn); input.disabled=!option.available;
      const name = document.createElement('span'); name.textContent=option.sn;
      const state = document.createElement('small'); state.textContent=option.available ? 'Available' : 'In use · '+option.owner;
      input.addEventListener('change', () => {
        selectedSn = input.checked ? [...selectedSn, option.sn] : selectedSn.filter(sn => sn !== option.sn);
        renderSn(); $('snOptions').querySelector('input[value="'+option.sn+'"]')?.focus();
      });
      row.append(input,name,state); host.append(row);
    });
    if (!matches.length) { const empty=document.createElement('div'); empty.className='sn-empty'; empty.textContent='No matching SNs'; host.append(empty); }
  }
  $('partnerName').addEventListener('change', () => { selectedSn=[]; $('snSearch').value=''; renderSn(); });
  $('snSearch').addEventListener('input',renderSnOptions); renderSn();
  function renderAttachments() {
    $('attachmentList').replaceChildren();
    attachments.forEach((attachment,index) => {
      const li=document.createElement('li'), label=document.createElement('span'), size=document.createElement('small');
      label.textContent=attachment.name; size.textContent=attachment.size;
      li.append(label,size,iconButton('Remove '+attachment.name, () => { attachments.splice(index,1); $('attachmentError').hidden=true; renderAttachments(); $('attachmentInput').focus(); }));
      $('attachmentList').append(li);
    });
  }
  $('attachmentInput').addEventListener('change', event => {
    const files=Array.from(event.target.files);
    if (attachments.length+files.length>5) { $('attachmentError').textContent='You can attach up to 5 files. Remove a file before adding more.'; $('attachmentError').hidden=false; }
    else {
      attachments.push(...files.map(file => ({ name:file.name, type:file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE', size: file.size<1024 ? file.size+' B' : Math.ceil(file.size/1024)+' KB' })));
      $('attachmentError').hidden=true; renderAttachments();
    }
    event.target.value='';
  }); renderAttachments();

  function values() {
    const result={}; [...simple,'status','leadResource','partnerName','country','region','attendant','vendingMachineType'].forEach(key => { result[key]=$(key).value; });
    result.otherServiceType = result.vendingMachineType === 'Other' ? result.otherServiceType : '';
    result.decisionMaker={name:$('decisionName').value,email:$('decisionEmail').value,phone:$('decisionPhone').value};
    result.secondDecisionMaker={name:$('secondName').value,email:$('secondEmail').value,phone:$('secondPhone').value};
    result.sameAsMerchant=$('sameAsMerchant').checked; result.sameAsFirst=$('sameAsFirst').checked;
    result.processing={}; ['averagePrice','minimumPrice','maximumPrice','monthlyVolume','additionalInformation'].forEach(key => { result.processing[key]=$(key).value; });
    result.serialNumbers=selectedSn; result.attachments=attachments; return result;
  }
  function showError(message) {
    const error=$('formError'); error.textContent=message; error.hidden=false;
    error.scrollIntoView({block:'center'}); error.focus({preventScroll:true});
  }
  function validate() {
    form.querySelectorAll('.field-error').forEach(el=>el.remove());
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    const errors=[];
    [['country','Select a country or region.'],['merchantName','Enter the merchant name.'],['contactName','Enter the contact name.'],['email','Enter a valid email address.']].forEach(([key,message]) => {
      if (!$(key).value.trim() || (key==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($(key).value.trim()))) {
        const input=pickers[key]?.input() || $(key); input.setAttribute('aria-invalid','true');
        const text=document.createElement('p'); text.className='field-error'; text.id=key+'-error'; text.textContent=message; input.setAttribute('aria-describedby',text.id); $(key).closest('.field').append(text); errors.push(message);
      }
    });
    if (errors.length) { showError('Please complete the required fields. '+errors.join(' ')); return false; }
    $('formError').hidden=true; return true;
  }
  function confirm(title, message, actionLabel, action) {
    Object.values(pickers).forEach(picker=>picker.close());
    $('confirmTitle').textContent=title; $('confirmMessage').textContent=message; $('acceptConfirm').textContent=actionLabel;
    dialogAction=action; $('leadConfirm').showModal(); $('cancelConfirm').focus();
  }
  $('cancelConfirm').addEventListener('click',()=>$('leadConfirm').close());
  $('acceptConfirm').addEventListener('click',()=>{ const action=dialogAction; $('leadConfirm').close(); action?.(); });
  $('leadConfirm').addEventListener('click',event=>{ if(event.target===$('leadConfirm')) { const rect=event.target.getBoundingClientRect(); if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) event.target.close(); } });
  function returnToList() { leaving=true; location.href=listUrl; }
  function requestLeave(action) {
    if (!blocked && JSON.stringify(values())!==initial) confirm('Discard changes?', 'Your changes have not been saved.', 'Discard',()=>{leaving=true; action();});
    else {leaving=true; action();}
  }
  $('cancelLead').addEventListener('click',()=>requestLeave(returnToList));
  // Delegation also protects the shared shell links installed after this script.
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if (!link || link.target==='_blank' || event.ctrlKey || event.metaKey || link.getAttribute('href').startsWith('#')) return;
    if (JSON.stringify(values())!==initial && !blocked) { event.preventDefault(); requestLeave(()=>{location.href=link.href;}); }
  });
  window.addEventListener('beforeunload',event=>{ if (!leaving && !blocked && JSON.stringify(values())!==initial) {event.preventDefault(); event.returnValue='';} });
  form.addEventListener('submit',event=>{
    event.preventDefault(); if(blocked || !validate()) return;
    confirm(id?'Save changes?':'Create Lead?', id?'Save your changes to this Lead?':'Create this UPT Lead with the entered information?', 'Save',()=>{
      $('saveLead').disabled=true;
      const result=data.saveLead(id,values());
      if (!result.valid) { $('saveLead').disabled=false; renderSnOptions(); showError(result.error); return; }
      leaving=true; location.href=listUrl+'?saved='+encodeURIComponent(result.record.processId)+(id?'':'&created=1');
    });
  });
  initial=JSON.stringify(values());
  if (blocked) {
    form.querySelectorAll('input,select,textarea,button').forEach(el=>{ if(el.id!=='cancelLead') el.disabled=true; });
    Object.values(pickers).forEach(picker=>picker.refresh());
    showError(record?'This Lead is no longer available for editing. Return to Leads to review its status.':'This Lead could not be found. Return to Leads and choose an existing record.');
  }
})();

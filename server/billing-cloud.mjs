import { createHmac, timingSafeEqual } from 'node:crypto';
import { makeBill, publicView, checkout, collect, day, summary } from './billing-engine.mjs';

export function createCloudHandler({repository, adminKey = process.env.BILLING_ADMIN_KEY || '', cronKey = process.env.CRON_SECRET || '', configured = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID), now = () => new Date(), publicOrigin = process.env.BILLING_PUBLIC_ORIGIN || '', allowedOrigins = (process.env.BILLING_ALLOWED_ORIGINS || '').split(',').filter(Boolean)} = {}) {
  const equal = (a,b) => { const left=Buffer.from(a), right=Buffer.from(b); return left.length === right.length && timingSafeEqual(left,right); };
  const sign = payload => createHmac('sha256', adminKey).update(payload).digest('base64url');
  function valid(token) {
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !equal(sign(payload), signature)) return false;
    try { return JSON.parse(Buffer.from(payload,'base64url')).exp > now().getTime(); } catch (_) { return false; }
  }
  function authorized(req) {
    const token = req.headers.authorization?.replace(/^Bearer /,'') || (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('pw_billing_cloud='))?.slice(17) || '';
    return valid(token);
  }
  function settleDue(bill) {
    if (bill.authorization && bill.status !== 'Paid' && !bill.installments.some(i=>i.status==='Failed') && bill.installments.some(i=>i.status!=='Paid' && i.due<=day(now()))) collect(bill,{now:now()});
  }
  const adminView = bill => ({...publicView(bill,now()), linkToken:bill.linkToken, deliveries:bill.deliveries});
  async function body(req) {
    if (req.body !== undefined) {
      const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (Buffer.byteLength(JSON.stringify(value)) > 2_000_000) throw new Error('Request too large.');
      return value;
    }
    const chunks=[];let bytes=0;
    for await(const chunk of req){bytes+=chunk.length;if(bytes>2_000_000)throw new Error('Request too large.');chunks.push(chunk);}
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  }
  return async function handler(req,res) {
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const origin = publicOrigin || 'https://' + req.headers.host;
    const requestOrigin = req.headers.origin;
    const reply=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
    const allowed = !requestOrigin || requestOrigin === origin || allowedOrigins.includes(requestOrigin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
    if (!allowed) return reply(403,{error:'This demo site is not allowed to connect.'});
    if(requestOrigin){res.setHeader('Access-Control-Allow-Origin',requestOrigin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
    if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
    const url=new URL(req.url,origin), path=url.searchParams.get('path') || url.pathname.replace(/^\/api\/billing\/?/,'');
    const ready=configured && adminKey.length>=32;
    if(path==='config') return reply(200,{mode:'shared',configured:ready});
    if(!ready) return reply(503,{error:'Shared demo is not configured yet. Use Demo settings to select Local demo.'});
    try {
      if(path==='session' && req.method==='POST') {
        const input=await body(req);
        if(!authorized(req) && !equal(String(input.accessKey || ''),adminKey)) return reply(401,{error:'Enter the management key in Demo settings to connect.'});
        const payload=Buffer.from(JSON.stringify({exp:now().getTime()+8*60*60*1000})).toString('base64url');
        const token=payload+'.'+sign(payload);
        res.setHeader('Set-Cookie','pw_billing_cloud='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/api/billing; Max-Age=28800');
        return reply(200,{token});
      }
      const publicMatch=path.match(/^public\/([a-f0-9]{48})(\/pay)?$/);
      if(publicMatch){
        const input=req.method==='POST'?await body(req):undefined;
        if (!(req.method==='GET'&&!publicMatch[2]) && !(req.method==='POST'&&publicMatch[2])) return reply(405,{error:'Method not allowed.'});
        const result=await repository.transact(records=>{
          const bill=records.find(r=>r.linkToken===publicMatch[1] && r.status!=='Draft');
          if(!bill)return null;
          if(input)checkout(bill,input,now());else settleDue(bill);
          return publicView(bill,now());
        });
        return result?reply(200,result):reply(404,{error:'This payment link is unavailable.'});
      }
      if(path==='cron' && req.method==='GET'){
        if(!cronKey || !equal(req.headers.authorization || '', 'Bearer '+cronKey))return reply(401,{error:'Unauthorized.'});
        await repository.transact(records=>records.forEach(settleDue));return reply(200,{ok:true});
      }
      if(!authorized(req))return reply(401,{error:'Enter the management key in Demo settings to connect.'});
      if(path==='records' && req.method==='GET'){
        const records=await repository.transact(records=>{records.forEach(settleDue);return records.map(adminView).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));});
        return reply(200,{records,publicOrigin:origin});
      }
      if(path==='import' && req.method==='POST'){
        const input=await body(req);
        if(!Array.isArray(input.records)||input.records.length>2000)throw new Error('Invalid billing import.');
        const records=await repository.transact(records=>{
          input.records.forEach(r=>{if(!records.some(b=>b.id===String(r.id)))records.push(makeBill(r,now(),true));});
          return records.map(adminView).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
        });
        return reply(200,{records,publicOrigin:origin});
      }
      if(path==='records' && req.method==='POST'){
        const input=await body(req);
        const result=await repository.transact(records=>{
          const index=records.findIndex(r=>r.id===String(input.id));
          if(index>=0 && records[index].status!=='Draft')throw new Error('Only draft bills can be edited.');
          const bill=makeBill(input,now());if(index>=0)records[index]=bill;else records.push(bill);
          return adminView(bill);
        });return reply(200,result);
      }
      const action=path.match(/^records\/([^/]+)\/(pay|send)$/);
      if(action && req.method==='POST'){
        const input=await body(req);
        const result=await repository.transact(records=>{
          const bill=records.find(r=>r.id===decodeURIComponent(action[1]));
          if(!bill || bill.status==='Draft')throw new Error('Bill unavailable.');
          if(action[2]==='pay'){
            if(bill.assignment==='standalone'||!bill.merchantId||String(input.merchantId)!==bill.merchantId)throw new Error('Merchant does not match this bill.');
            checkout(bill,{...input,source:'portal'},now());
          }else{
            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '')||input.email.length>254)throw new Error('Enter a valid recipient email.');
            if(summary(bill,now()).linkExpired||bill.status==='Paid'||bill.authorization)throw new Error('This bill no longer needs a payment link.');
            bill.deliveries.push({email:input.email,at:now().toISOString(),status:'Simulated'});
          }return adminView(bill);
        });return reply(200,result);
      }
      return reply(404,{error:'Billing endpoint not found.'});
    }catch(error){return reply(400,{error:error.message});}
  };
}

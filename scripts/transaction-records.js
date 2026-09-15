/* Shared static prototype records. No production API or authorization is simulated here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PaywizardTransactions=api;})(typeof window==='undefined'?this:window,function(){
'use strict';
      const terminalTciBySn={
        PWKIOSK03260427:"TC26042703",
        PWKIOSK04260427:"TC26042704",
        PWKIOSK05260427:"TC26042705",
        PWPOS01260427:"TC26042701",
        WP5151DQ33000097:"TC33000097",
        WP52205Q33000977:"TC33000977",
        WP5280VQ33200002:"TC33200002",
        WP5280VQ33200005:"TC33200005",
        WP5280VQ33200006:"TC33200006",
        WP5280VQ33200016:"TC33200016",
        WP6001MM33000109:"TC33000109",
        WP6127TX33009110:"TC33009110",
        WP7300EV33001088:"TC33001088",
        WP7400AC33002019:"TC33002019"
      };
const rows=[
        {status:"completed",processorTime:"2026-04-27 10:18:34",terminalTime:"-",timezone:"",invoiceNumber:"260427101834",paymentMethod:"Prepaid",cardBrand:"prepaid",cardPanMasked:"04A37C91B25F80",cardPanPlain:"04A37C91B25F80",cardDisplayNo:"EMP-CARD-004218",approvalCode:"A93F2B",type:"Purchase",amount:"3.50",baseAmount:"3.00",tipAmount:"0.50",currency:"USD",mid:"202604270000183",tid:"Coffee Kiosk 03",merchantName:"HQ Canteen",storeName:"Coffee Kiosk 03",sn:"PWKIOSK03260427",paywizardId:"PWV-260427-100183",transId:"TRX-100183",transLogId:"LOG-260427-100183",transIndexCode:"IDX-260427-100183",batch:"B918",trace:"100183",terminalName:"Coffee Kiosk 03",phoneNumber:"+1 604 555 0188",email:"ops@merchant.test",storeId:"STORE-HQ03",terminalUsage:"self_service",terminalScene:"Coffee Kiosk"},
        {status:"completed",processorTime:"2026-04-27 10:21:09",terminalTime:"-",timezone:"",invoiceNumber:"260427102109",paymentMethod:"Prepaid",cardBrand:"prepaid",cardPanMasked:"04A37C91B25F80",cardPanPlain:"04A37C91B25F80",cardDisplayNo:"EMP-CARD-004218",approvalCode:"T91P4C",type:"Tip Adjust",amount:"1.00",currency:"USD",mid:"202604270000183",tid:"Coffee Kiosk 04",merchantName:"HQ Canteen",storeName:"Coffee Kiosk 04",sn:"PWKIOSK04260427",paywizardId:"PWT-260427-100183",transId:"TRX-TIP-100183",transLogId:"LOG-260427-102109",transIndexCode:"IDX-260427-102109",batch:"B918",trace:"102109",terminalName:"Coffee Kiosk 04",phoneNumber:"+1 604 555 0188",email:"ops@merchant.test",storeId:"STORE-HQ04",terminalUsage:"self_service",terminalScene:"Coffee Kiosk",originalTransId:"TRX-100183",originalAmount:"3.50",tipAmount:"1.00"},
        {status:"completed",processorTime:"2026-04-27 09:42:21",terminalTime:"-",timezone:"",invoiceNumber:"260427094221",paymentMethod:"Prepaid",cardBrand:"prepaid",cardPanMasked:"0418E6AA923B11",cardPanPlain:"0418E6AA923B11",cardDisplayNo:"EMP-CARD-002106",approvalCode:"R71K8M",type:"Refund",amount:"4.20",currency:"USD",mid:"202604270000221",tid:"Staff POS Counter",merchantName:"HQ Canteen",storeName:"Staff POS Counter",sn:"PWPOS01260427",paywizardId:"PWR-260427-094221",transId:"TRX-094221",transLogId:"LOG-260427-094221",transIndexCode:"IDX-260427-094221",batch:"B918",trace:"094221",terminalName:"Staff POS Counter",phoneNumber:"+1 604 555 0188",email:"ops@merchant.test",storeId:"STORE-HQ01",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 12:25:08",terminalTime:"-",timezone:"",invoiceNumber:"260407122508",paymentMethod:"QR",cardBrand:"qr",cardPanMasked:"QR-260407-122508",cardPanPlain:"QR-260407-122508",approvalCode:"QR8821",type:"Purchase",amount:"12.80",currency:"USD",mid:"202604070000016",tid:"WSTORE-Q3-02",merchantName:"wstore-test",storeName:"Shanghai Lab Store",sn:"WP5280VQ33200002",paywizardId:"PW-20260407-122508",transId:"TRX-122508",transLogId:"LOG-20260407-122508",transIndexCode:"IDX-20260407-122508",batch:"B552",trace:"560052",terminalName:"Q3mini Lab 02",phoneNumber:"+86 21 5555 1200",email:"ops@wstore.test",storeId:"STORE-5422",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 12:16:42",terminalTime:"-",timezone:"",invoiceNumber:"260407121642",cardBrand:"visa",cardPanMasked:"445952****1859",cardPanPlain:"4459521859",approvalCode:"719204",type:"Purchase",amount:"21.40",currency:"USD",mid:"202604070000015",tid:"WSTORE-Q3-02",merchantName:"wstore-test",storeName:"Shanghai Lab Store",sn:"WP5280VQ33200002",paywizardId:"PW-20260407-121642",transId:"TRX-121642",transLogId:"LOG-20260407-121642",transIndexCode:"IDX-20260407-121642",batch:"B552",trace:"560041",terminalName:"Q3mini Lab 02",phoneNumber:"+86 21 5555 1200",email:"ops@wstore.test",storeId:"STORE-5422",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 12:08:19",terminalTime:"-",timezone:"",invoiceNumber:"260407120819",cardBrand:"visa",cardPanMasked:"471622****7019",cardPanPlain:"4716227019",approvalCode:"880145",type:"Purchase",amount:"31.20",currency:"USD",mid:"202511040001208",tid:"Waiter Handheld 02",merchantName:"urban bistro",storeName:"city center",sn:"WP6001MM33000109",paywizardId:"PW-20260407-120819",transId:"TRX-120819",transLogId:"LOG-20260407-120819",transIndexCode:"IDX-20260407-120819",batch:"B103",trace:"560012",terminalName:"Waiter Mobile 02",phoneNumber:"+1 212 555 4010",email:"shiftlead@urbanbistro.test",storeId:"STORE-4012",terminalUsage:"staff_mobile",terminalScene:"Staff Handheld"},
        {status:"completed",processorTime:"2026-04-07 12:03:36",terminalTime:"-",timezone:"",invoiceNumber:"260407120336",cardBrand:"visa",cardPanMasked:"402400****2198",cardPanPlain:"4024002198",approvalCode:"902144",type:"Purchase",amount:"18.75",currency:"EUR",mid:"202604070000706",tid:"EV Bay 07",merchantName:"green charge network",storeName:"airport parking",sn:"WP7300EV33001088",paywizardId:"PW-20260407-120336",transId:"TRX-120336",transLogId:"LOG-20260407-120336",transIndexCode:"IDX-20260407-120336",batch:"B701",trace:"560007",terminalName:"EV Charger Bay 07",phoneNumber:"+49 30 5555 0188",email:"ops@greencharge.test",storeId:"STORE-7088",terminalUsage:"self_service",terminalScene:"EV Charging"},
        {status:"completed",processorTime:"2026-04-07 11:55:28",terminalTime:"-",timezone:"",invoiceNumber:"260407115528",cardBrand:"maestro",cardPanMasked:"621700****4380",cardPanPlain:"6217004380",approvalCode:"114930",type:"Purchase",amount:"3.00",currency:"USD",mid:"202604070000880",tid:"ARCADE-19",merchantName:"playbox arcade",storeName:"mall west",sn:"WP7400AC33002019",paywizardId:"PW-20260407-115528",transId:"TRX-115528",transLogId:"LOG-20260407-115528",transIndexCode:"IDX-20260407-115528",batch:"B880",trace:"559941",terminalName:"Arcade Cabinet 19",phoneNumber:"+1 408 555 7719",email:"floor@playbox.test",storeId:"STORE-8019",terminalUsage:"self_service",terminalScene:"Arcade Machine"},
        {status:"completed",processorTime:"2026-04-07 11:47:56",terminalTime:"-",timezone:"",invoiceNumber:"260407114756",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Purchase",amount:"16.98",currency:"GBP",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-114756",transId:"TRX-114756",transLogId:"LOG-20260407-114756",transIndexCode:"IDX-20260407-114756",batch:"B347",trace:"550321",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 11:22:19",terminalTime:"-",timezone:"",invoiceNumber:"260407112219",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Refund",amount:"6.03",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-112219",transId:"TRX-112219",transLogId:"LOG-20260407-112219",transIndexCode:"IDX-20260407-112219",batch:"B347",trace:"550322",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 11:21:14",terminalTime:"-",timezone:"",invoiceNumber:"260407112114",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Refund",amount:"7.23",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-112114",transId:"TRX-112114",transLogId:"LOG-20260407-112114",transIndexCode:"IDX-20260407-112114",batch:"B347",trace:"550323",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 11:19:01",terminalTime:"-",timezone:"",invoiceNumber:"260407111901",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Purchase",amount:"8.03",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-111901",transId:"TRX-111901",transLogId:"LOG-20260407-111901",transIndexCode:"IDX-20260407-111901",batch:"B347",trace:"550324",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 11:18:41",terminalTime:"-",timezone:"",invoiceNumber:"260407111841",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Purchase",amount:"7.23",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-111841",transId:"TRX-111841",transLogId:"LOG-20260407-111841",transIndexCode:"IDX-20260407-111841",batch:"B347",trace:"550325",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 11:18:22",terminalTime:"-",timezone:"",invoiceNumber:"260407111822",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"-",type:"Purchase",amount:"6.03",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-111822",transId:"TRX-111822",transLogId:"LOG-20260407-111822",transIndexCode:"IDX-20260407-111822",batch:"B347",trace:"550326",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"completed",processorTime:"2026-04-07 10:46:02",terminalTime:"-",timezone:"",invoiceNumber:"260407104602",cardBrand:"maestro",cardPanMasked:"621700****9814",cardPanPlain:"6217009814",approvalCode:"622397",type:"Purchase",amount:"0.01",currency:"USD",mid:"TestDemoMID",tid:"TestDemo",merchantName:"waou test merchant",storeName:"wa ou test store",sn:"WP52205Q33000977",paywizardId:"PW-20260407-104602",transId:"TRX-104602",transLogId:"LOG-20260407-104602",transIndexCode:"IDX-20260407-104602",batch:"B344",trace:"548901",terminalName:"Waou Terminal 01",phoneNumber:"+1 415 555 2201",email:"store@waou.test",storeId:"STORE-2004",terminalUsage:"standalone",terminalScene:"Standalone Terminal"},
        {status:"completed",processorTime:"2026-04-07 10:39:16",terminalTime:"-",timezone:"",invoiceNumber:"260407103916",cardBrand:"maestro",cardPanMasked:"621700****9814",cardPanPlain:"6217009814",approvalCode:"506708",type:"Purchase",amount:"0.01",currency:"USD",mid:"TestDemoMID",tid:"TestDemo",merchantName:"waou test merchant",storeName:"wa ou test store",sn:"WP52205Q33000977",paywizardId:"PW-20260407-103916",transId:"TRX-103916",transLogId:"LOG-20260407-103916",transIndexCode:"IDX-20260407-103916",batch:"B344",trace:"548902",terminalName:"Waou Terminal 01",phoneNumber:"+1 415 555 2201",email:"store@waou.test",storeId:"STORE-2004",terminalUsage:"standalone",terminalScene:"Standalone Terminal"},
        {status:"completed",processorTime:"2026-04-07 10:21:51",terminalTime:"-",timezone:"",invoiceNumber:"260407102151",cardBrand:"visa",cardPanMasked:"414740****8821",cardPanPlain:"4147408821",approvalCode:"331890",type:"Purchase",amount:"4.50",currency:"CAD",mid:"202511040000901",tid:"Campus Kiosk 03",merchantName:"north campus group",storeName:"sfu dining commons",sn:"WP6127TX33009110",paywizardId:"PW-20260407-102151",transId:"TRX-102151",transLogId:"LOG-20260407-102151",transIndexCode:"IDX-20260407-102151",batch:"B211",trace:"547009",terminalName:"Beverage Kiosk 03",phoneNumber:"+1 604 555 7788",email:"vending.ops@campus.test",storeId:"STORE-3150",terminalUsage:"self_service",terminalScene:"Beverage Kiosk"},
        {status:"completed",processorTime:"2026-04-07 10:16:45",terminalTime:"-",timezone:"",invoiceNumber:"260407101645",cardBrand:"visa",cardPanMasked:"445952****1859",cardPanPlain:"4459521859",approvalCode:"INC45",type:"Incremental",amount:"10.00",currency:"EUR",mid:"202604070000015",tid:"WSTORE-Q3-05",merchantName:"wstore-test",storeName:"Shanghai Lab Store",sn:"WP5280VQ33200005",paywizardId:"PWI-20260407-101645",transId:"TRX-INC-101645",transLogId:"LOG-20260407-101645",transIndexCode:"IDX-20260407-101645",batch:"B552",trace:"547004",terminalName:"Q3mini Lab 05",phoneNumber:"+86 21 5555 1200",email:"ops@wstore.test",storeId:"STORE-5422",terminalUsage:"pos_linked",terminalScene:"Counter POS",originalTransId:"TRX-AUTH-100812",originalAmount:"85.00"},
        {status:"completed",processorTime:"2026-04-07 10:12:28",terminalTime:"-",timezone:"",invoiceNumber:"260407101228",cardBrand:"visa",cardPanMasked:"445952****1859",cardPanPlain:"4459521859",approvalCode:"INC28",type:"Incremental",amount:"15.00",currency:"EUR",mid:"202604070000015",tid:"WSTORE-Q3-06",merchantName:"wstore-test",storeName:"Shanghai Lab Store",sn:"WP5280VQ33200006",paywizardId:"PWI-20260407-101228",transId:"TRX-INC-101228",transLogId:"LOG-20260407-101228",transIndexCode:"IDX-20260407-101228",batch:"B552",trace:"546998",terminalName:"Q3mini Lab 06",phoneNumber:"+86 21 5555 1200",email:"ops@wstore.test",storeId:"STORE-5422",terminalUsage:"pos_linked",terminalScene:"Counter POS",originalTransId:"TRX-AUTH-100812",originalAmount:"85.00"},
        {status:"completed",processorTime:"2026-04-07 10:08:12",terminalTime:"-",timezone:"",invoiceNumber:"260407100812",cardBrand:"visa",cardPanMasked:"445952****1859",cardPanPlain:"4459521859",approvalCode:"AUTH82",type:"Auth",amount:"85.00",currency:"EUR",mid:"202604070000015",tid:"WSTORE-Q3-02",merchantName:"wstore-test",storeName:"Shanghai Lab Store",sn:"WP5280VQ33200002",paywizardId:"PWA-20260407-100812",transId:"TRX-AUTH-100812",transLogId:"LOG-20260407-100812",transIndexCode:"IDX-20260407-100812",batch:"B552",trace:"546980",terminalName:"Q3mini Lab 02",phoneNumber:"+86 21 5555 1200",email:"ops@wstore.test",storeId:"STORE-5422",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"failed",processorTime:"2026-04-07 09:58:11",terminalTime:"-",timezone:"",invoiceNumber:"260407095811",cardBrand:"visa",cardPanMasked:"474846****3001",cardPanPlain:"4748463001",approvalCode:"DECLINED",type:"Failed",amount:"12.50",currency:"USD",mid:"202511040000001",tid:"Test Demo",merchantName:"foodhub test",storeName:"foodhub test",sn:"WP5151DQ33000097",paywizardId:"PW-20260407-095811",transId:"TRX-095811",transLogId:"LOG-20260407-095811",transIndexCode:"IDX-20260407-095811",batch:"B346",trace:"547220",terminalName:"Foodhub Front Desk",phoneNumber:"+44 20 7946 1010",email:"ops@foodhub.test",storeId:"STORE-1001",terminalUsage:"pos_linked",terminalScene:"Counter POS"},
        {status:"failed",processorTime:"2026-04-07 09:42:33",terminalTime:"-",timezone:"",invoiceNumber:"260407094233",cardBrand:"maestro",cardPanMasked:"621700****9814",cardPanPlain:"6217009814",approvalCode:"DECLINED",type:"Failed",amount:"19.80",currency:"USD",mid:"TestDemoMID",tid:"TestDemo",merchantName:"waou test merchant",storeName:"wa ou test store",sn:"WP52205Q33000977",paywizardId:"PW-20260407-094233",transId:"TRX-094233",transLogId:"LOG-20260407-094233",transIndexCode:"IDX-20260407-094233",batch:"B344",trace:"547225",terminalName:"Waou Terminal 01",phoneNumber:"+1 415 555 2201",email:"store@waou.test",storeId:"STORE-2004",terminalUsage:"standalone",terminalScene:"Standalone Terminal"},
        {status:"failed",processorTime:"2026-04-07 09:31:40",terminalTime:"-",timezone:"",invoiceNumber:"260407093140",cardBrand:"visa",cardPanMasked:"471622****7019",cardPanPlain:"4716227019",approvalCode:"DECLINED",type:"Failed",amount:"29.80",currency:"USD",mid:"202511040001208",tid:"Waiter Handheld 02",merchantName:"urban bistro",storeName:"city center",sn:"WP6001MM33000109",paywizardId:"PW-20260407-093140",transId:"TRX-093140",transLogId:"LOG-20260407-093140",transIndexCode:"IDX-20260407-093140",batch:"B102",trace:"546812",terminalName:"Waiter Mobile 02",phoneNumber:"+1 212 555 4010",email:"shiftlead@urbanbistro.test",storeId:"STORE-4012",terminalUsage:"staff_mobile",terminalScene:"Staff Handheld"}
      ];
      const simulationSeeds=rows.filter(row=>row.status==="completed").slice(0,12);
      const simulationTypes=["Purchase","Purchase","Sale","Refund","Auth","Purchase"];
      Array.from({length:48},(_,index)=>{
        const number=index+1;
        const seed=simulationSeeds[index%simulationSeeds.length];
        const failed=number%6===0;
        const hour=9+Math.floor((47-index)/6);
        const minute=(index*7)%60;
        const second=(index*13)%60;
        const token=String(700000+number);
        return {
          ...seed,
          originalTransId:undefined, originalAmount:undefined, tipAmount:undefined, baseAmount:undefined,
          status:failed?"failed":"completed",
          processorTime:`2026-04-06 ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`,
          invoiceNumber:`260406${token}`,
          approvalCode:failed?"DECLINED":`A${String(91000+number)}`,
          type:simulationTypes[index%simulationTypes.length],
          amount:(2.5+((index*7.35)%118)).toFixed(2),
          paywizardId:`PW-20260406-${token}`,
          transId:`TRX-${token}`,
          transLogId:`LOG-20260406-${token}`,
          transIndexCode:`IDX-20260406-${token}`,
          batch:`B${String(600+Math.floor(index/10))}`,
          trace:token
        };
      }).forEach(row=>rows.push(row));
      
      const transactionChannelByMid={
        "202604270000183":"FISERV",
        "202604270000221":"FISERV",
        "202604070000016":"TSYS",
        "202604070000015":"TSYS",
        "202511040001208":"ELAVON",
        "202604070000706":"NUVEI",
        "202604070000880":"NUVEI",
        "202511040000001":"FISERV",
        "TestDemoMID":"TSYS",
        "202511040000901":"ELAVON"
      };
      const transactionChannelForRow=row=>row?.transactionChannel||transactionChannelByMid[row?.mid]||"TSYS";

rows.forEach(r=>{r.tci=terminalTciBySn[r.sn]||'-';r.transactionChannel=transactionChannelForRow(r);r.processorTimezone='UTC';if(r.sn==='WP5151DQ33000097')r.terminalControl='lost';r.receiptAvailable=r.status==='completed';});
// Explicit, fictional payment references exercise all states and multiple levels.
function sample(parent,id,type,status,amount,time,extra={}) {
  const r={...parent,paywizardId:id,transId:'TRX-'+id,transLogId:'LOG-'+id,transIndexCode:'IDX-'+id,
    originalRecordId:parent.paywizardId,originalTransId:parent.transId,type,status,amount,processorTime:time,
    invoiceNumber:id,trace:id,approvalCode:status==='completed'?'APPROVED':status==='failed'?'DECLINED':'-',
    receiptAvailable:status==='completed',baseAmount:undefined,tipAmount:undefined,...extra};
  rows.push(r);return r;
}
const sale=rows[0];
sample(sale,'PWR-DEMO-FAILED','Refund','failed','1.00','2026-04-27 10:23:00');
sample(sale,'PWR-DEMO-SUCCESS','Refund','completed','0.50','2026-04-27 10:24:00');
sample(sale,'PWR-DEMO-PENDING','Refund','pending','0.50','2026-04-27 10:25:00');
const auth=rows.find(r=>r.paywizardId==='PWA-20260407-100812');
const capture=sample(auth,'PWC-DEMO-CAPTURE','Capture','completed','100.00','2026-04-07 10:30:00');
const refund=sample(capture,'PWR-DEMO-CAPTURE-REFUND','Refund','completed','20.00','2026-04-07 10:35:00');
sample(refund,'PWV-DEMO-REFUND-VOID','Void','completed','20.00','2026-04-07 10:40:00');
sample(auth,'PWI-DEMO-FAILED','Incremental','failed','5.00','2026-04-07 10:20:00');
sample(sale,'PWR-DEMO-MISSING','Refund','completed','2.00','2026-04-27 10:26:00',{
 originalRecordId:undefined,originalTransId:'TRX-HISTORY-UNAVAILABLE',relationshipIncomplete:true});
// Original detailed demo retained as its own record; never used as another record's fallback.
const legacyDetail={checkoutId:"CKO-20260327-000872",transIndexCode:"EXT-ORDER-20260327-887241",paywizardId:"1022553788583641089",mid:"444500187868600",transType:"Purchase",amount:"2.50",state:2,currencyCode:"978",tranTime:"2026-03-27 13:59:41",transDate:"20260327",transTime:"135941",terminalDateTime:"2026-03-27 21:59:41",terminalTimezone:"UTC+08:00",cardNo:"445952******1859",cardToken:"tok_9H2Q7P8A11",sn:"WP44907Q33200398",transResult:0,transId:"TXN-99882716105",invoiceNum:"00001258",traceNum:"563829",rrn:"032713595841",respCode:"00",respDesc:"Approved",transScheme:"VISA",callerName:"Portal Transaction API",approvalCode:"AP5198",entryMode:"Chip",expiryDate:"1228",cardBrand:"Visa Credit",transAmount:250,otherAmount:0,tipAmount:0,balance:325000,taxAmount:0,dccOriCurrencyCode:"840",dccOriAmount:272,dccFee:6,dccExchangeRate:"1.0869",dccMarkUp:"3.50%",dccFooterText:"Customer chose local currency settlement.",countryCode:"440",merchantId:"MRC88214011",tId:"TID003826",tci:"TC48273915",merchantName:"Demo Cafe Berlin",merchantAddress:"Retail shop T1",authCode:"5198A7",oriTransIndexCode:"EXT-ORDER-20260326-552018",oriInvoiceNum:"00001213",oriTransId:"TXN-99882001387",oriRrn:"032612250918",emvAid:"A0000000031010",emvAppName:"Visa Credit",emvCryptogram:"7F3C1A9D20C87115",emvTvr:"0000008000",additionalInfo:"Offline data authentication passed.",cardUniqueId:"CU-8A3E-9921-44F1",dutyFreeAmount:"0.00",batchNum:"000347",opcAction:"push_transaction",opcVersionName:"Paywizard Retail",opcVersionCode:"2.6.1_20260304",hasMSR:false,batchDetailInfo:"Batch 347 / Shift A / Closed at 23:00",unifiedCategory:"Approved",unifiedCode:"PW-0000",notifyUrl:"https://merchant.demo/paywizard/callback",receiptEmail:"customer@email.com",sign:"46a1c4b15c60f6730ff5f57d8db8408a6a9f35e1"};
legacyDetail.externalOrderNo=legacyDetail.transIndexCode;
rows.push({paywizardId:legacyDetail.paywizardId,transId:legacyDetail.transId,status:'completed',type:legacyDetail.transType,
 amount:legacyDetail.amount,currency:'EUR',processorTime:legacyDetail.tranTime,processorTimezone:'UTC',
 terminalTime:legacyDetail.terminalDateTime,timezone:legacyDetail.terminalTimezone,mid:legacyDetail.mid,tid:legacyDetail.tId,
 terminalName:legacyDetail.merchantAddress,sn:legacyDetail.sn,merchantName:legacyDetail.merchantName,tci:legacyDetail.tci,
 cardPanMasked:legacyDetail.cardNo,cardBrand:legacyDetail.cardBrand,approvalCode:legacyDetail.approvalCode,
 invoiceNumber:legacyDetail.invoiceNum,trace:legacyDetail.traceNum,batch:legacyDetail.batchNum,email:legacyDetail.receiptEmail,
 externalOrderNo:legacyDetail.externalOrderNo,rrn:legacyDetail.rrn,terminalUsage:'pos_linked',receiptAvailable:true,detail:legacyDetail});
const storageKey='paywizard.transactionRecords.v1';
function getRecords(){
 let additions=[];
 try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))additions=saved;}catch(_){}
 return [...additions,...rows].filter((r,i,all)=>r&&r.paywizardId&&all.findIndex(x=>x.paywizardId===r.paywizardId)===i).map(r=>({...r}));
}
function saveRecord(row){
 const additions=getRecords().filter(r=>!rows.some(seed=>seed.paywizardId===r.paywizardId)&&r.paywizardId!==row.paywizardId);
 sessionStorage.setItem(storageKey,JSON.stringify([row,...additions]));
}
const scope=r=>r.mid&&r.transactionChannel?JSON.stringify([r.mid,r.transactionChannel]):null;
function related(records,id,canView=()=>true){
 // Query must receive the server-authorized scope in production. Filter before graph construction.
 const visible=records.filter(canView);const byId=new Map();const duplicates=new Set();
 for(const r of visible){if(byId.has(r.paywizardId))duplicates.add(r.paywizardId);else byId.set(r.paywizardId,r);}
 if(!byId.has(id))throw new Error('Transaction unavailable. Return to Transactions and select an available record.');
 const parents=new Map(),issues=new Set(),neighbors=new Map([...byId.keys()].map(key=>[key,new Set()]));
 for(const r of byId.values()){
  let candidates=[];
  if(r.originalRecordId)candidates=visible.filter(p=>p.paywizardId===r.originalRecordId&&scope(r)!==null&&scope(p)===scope(r));
  else if(r.originalTransId)candidates=visible.filter(p=>p.transId===r.originalTransId&&scope(r)!==null&&scope(p)===scope(r));
  if(candidates.length===1&&r.originalRecordId&&r.originalTransId&&candidates[0].transId!==r.originalTransId){issues.add(r.paywizardId);continue;}
  if(candidates.length===1&&!duplicates.has(candidates[0].paywizardId)){
   const pid=candidates[0].paywizardId;parents.set(r.paywizardId,pid);neighbors.get(r.paywizardId).add(pid);neighbors.get(pid).add(r.paywizardId);
  }else if(candidates.length>1||r.relationshipIncomplete)issues.add(r.paywizardId);
 }
 const visited=new Set(),queue=[id];while(queue.length){const key=queue.pop();if(visited.has(key))continue;visited.add(key);for(const n of neighbors.get(key))queue.push(n);}
 let incomplete=[...visited].some(key=>issues.has(key)||duplicates.has(key));
 for(const key of visited){const path=new Set();let next=key;while(parents.has(next)){if(path.has(next)){incomplete=true;break;}path.add(next);next=parents.get(next);}}
 const items=[...visited].map(key=>byId.get(key)).sort((a,b)=>a.processorTime.localeCompare(b.processorTime)||a.paywizardId.localeCompare(b.paywizardId));
 const roots=items.filter(r=>!parents.has(r.paywizardId)&&!r.originalRecordId&&!r.originalTransId);
 return {items,parents,total:items.length,incomplete,root:roots.length===1?roots[0]:null};
}
function detailHref(id,fromList=false){return '11.transaction_detail_redesign.html?transactionId='+encodeURIComponent(id)+(fromList?'&from=list':'')+'#relatedTransactions';}
const resultLabel=r=>({completed:'Completed',failed:'Failed',pending:'Pending'})[r.status]||'Unknown';
return {getRecords,saveRecord,related,detailHref,resultLabel};
});

const test=require('node:test');
const assert=require('node:assert/strict');
const brands=require('../../scripts/payment-brands.js');

test('recognized card schemes render their brand assets without text labels',()=>{
 assert.match(brands.logo('Visa Credit'),/visa-mark\.svg/);
 assert.match(brands.logo('mastercard'),/mastercard-mark\.svg/);
 assert.doesNotMatch(brands.logo('Visa Credit'),/>Visa</);
});

test('unknown card schemes render the generic card asset',()=>{
 assert.match(brands.logo('Domestic Network'),/card-generic\.svg/);
 assert.match(brands.logo(''),/alt="Unknown card scheme"/);
});

test('prepaid and qr are payment methods rather than card schemes',()=>{
 assert.equal(brands.logo('prepaid'),'');
 assert.equal(brands.logo('qr'),'');
 assert.match(brands.detail('prepaid'),/>Prepaid</);
});

test('transaction details place a decorative logo before readable scheme text',()=>{
 const markup=brands.detail('Visa Credit');
 assert.ok(markup.indexOf('<img')<markup.indexOf('Visa Credit</span>'));
 assert.match(markup,/alt=""/);
});

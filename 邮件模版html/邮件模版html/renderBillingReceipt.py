"""Render a successful-payment receipt. Usage: python3 renderBillingReceipt.py input.json output.html"""
import json, sys
from pathlib import Path
from html import escape
from string import Template

def render(data):
    if data['paymentStatus'] != 'Succeeded':
        raise ValueError('Receipts require a successful payment')
    if data['assignment'] not in ('merchant', 'standalone'):
        raise ValueError('Invalid assignment')
    def text(value):
        return escape(str(value), quote=True)
    def row(label, value):
        return '<tr><td width="180" valign="top" style="padding:14px 12px 0 0;color:#71717a;">'+text(label)+'</td><td valign="top" align="right" style="padding:14px 0 0;font-weight:500;overflow-wrap:anywhere;">'+text(value)+'</td></tr>'
    def section(title, body):
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px dashed #fef08a;color:#854d0e;"><tr><td style="padding:18px 20px;font-size:13px;line-height:22px;"><p style="margin:0 0 8px;font-weight:600;">'+text(title)+'</p>'+body+'</td></tr></table>'
    values = {key:text(data[key]) for key in ('invoiceNumber','amountPaid','paidAt','issuerName','description','paymentMethod')}
    logo = data.get('logoUrl', 'billingReceiptLogo.png')
    if not (logo == 'billingReceiptLogo.png' or logo.startswith('https://') or logo.startswith('cid:')):
        raise ValueError('Use an HTTPS or CID logo URL')
    values['logoUrl'] = text(logo)
    values['preheader'] = text(data['amountPaid']+' paid · Invoice '+data['invoiceNumber'])
    def detail(value, color='#6b7280'):
        return '<div style="font-size:13px;line-height:20px;color:'+color+';">'+text(value)+'</div>'
    values['merchantRows'] = detail('Merchant: '+data['merchantName']) if data['assignment']=='merchant' else ''
    values['paymentRows'] = detail(('Fixed-term monthly' if data['recurring'] else 'One-time')+' · '+data['billType'])
    if data.get('includedData') is not None and data['billType']=='eSIM Billing':
        values['paymentRows'] += detail('Included data: '+str(data['includedData'])+' MB')
    values['installmentSection'] = ''
    if data['recurring']:
        number, term = data['installmentNumber'], data['installmentCount']
        if not 1 <= number <= term or not 1 <= data['paidInstallmentCount'] <= term:
            raise ValueError('Invalid installment counts')
        values['paymentRows'] += detail('Billing Cycle: Month '+str(number)+' of '+str(term), '#2563eb')
        if data.get('collectionStopped'):
            body = 'Collection has stopped. This payment was already processing and has now completed. No new payments will be collected.'
        elif data['paidInstallmentCount']==term:
            body = 'All '+str(term)+' installments have been paid. No further payments will be collected for this bill.'
        elif data.get('overdueRemaining'):
            body = 'There are remaining overdue installments. Each will be collected separately.'
        elif data.get('nextPaymentDate'):
            body = 'Next payment: <strong>'+text(data['nextAmount'])+'</strong> on <strong>'+text(data['nextPaymentDate'])+'</strong>.'
        else:
            body = 'No further automatic attempts are scheduled. Please review any remaining unpaid installments.'
        values['installmentSection'] = '<p style="margin:0 0 20px;font-size:13px;line-height:21px;color:#6b7280;">'+body+'</p>'
    if data.get('paymentReference'):
        values['paymentRows'] += detail('Payment ID: '+data['paymentReference'])
    values['notesSection'] = section('Billing note','<p style="margin:0;overflow-wrap:anywhere;">'+text(data['notes']).replace('\n','<br>')+'</p>') if data.get('notes') else ''
    # Keep the raw template previewable while honoring the delivery image URL.
    template = Path(__file__).with_name('billingPaymentReceipt.html').read_text()
    return Template(template.replace('src="billingReceiptLogo.png"', 'src="${logoUrl}"')).substitute(values)

def render_message(data):
    from html.parser import HTMLParser
    class PlainText(HTMLParser):
        def __init__(self):
            super().__init__(); self.parts = []; self.skip = 0
        def handle_starttag(self, tag, attrs):
            if tag in ('style', 'head'): self.skip += 1
            if not self.skip and tag in ('p', 'div', 'tr', 'br'): self.parts.append('\n')
        def handle_endtag(self, tag):
            if tag in ('style', 'head'): self.skip -= 1
            if not self.skip and tag in ('td', 'th'): self.parts.append(' ')
        def handle_data(self, value):
            if not self.skip: self.parts.append(value)
    html = render(data); parser = PlainText(); parser.feed(html)
    text = '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())
    return {'subject': 'Payment receipt — '+data['invoiceNumber'], 'html': html, 'text': text+'\n'}

if __name__=='__main__':
    output=Path(sys.argv[2]); message=render_message(json.loads(Path(sys.argv[1]).read_text()))
    output.write_text(message['html'])
    output.with_suffix('.txt').write_text(message['text'])
    output.with_suffix('.subject.txt').write_text(message['subject']+'\n')

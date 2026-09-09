"""Render a payment invitation; never sends email.
Usage: python3 renderBillingPaymentLink.py input.json output.html [--preview]
Writes HTML plus sibling .txt (plain body) and .subject.txt (subject).
"""
import argparse
import json
from datetime import date
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit


def render(data, *, preview=False):
    def required(key):
        value = data.get(key)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f'{key} must be a nonempty string')
        return value.strip()

    def https_url(value):
        parsed = urlsplit(value)
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username
                or parsed.password or any(c.isspace() or ord(c) < 32 for c in value)):
            raise ValueError('Use an absolute HTTPS URL')
        return value

    if data.get('assignment') not in ('merchant', 'standalone'):
        raise ValueError('assignment must be merchant or standalone')
    if type(data.get('recurring')) is not bool:
        raise ValueError('recurring must be a boolean')
    invoice, issuer = required('invoiceNumber'), required('issuerName')
    if any(c in invoice for c in '\r\n'):
        raise ValueError('invoiceNumber cannot contain line breaks')
    amount, description = required('amountDue'), required('description')
    payment_url = https_url(required('paymentUrl'))
    portal_url = https_url(required('portalUrl')) if data['assignment'] == 'merchant' else ''
    invitation = f'{issuer} has sent you a bill. You can review and pay it directly using the payment link without signing in.'
    if portal_url:
        invitation += ' If you have a merchant account, you can also sign in to the Merchant Portal to review and pay the same bill.'
    logo = data.get('logoUrl', 'billingReceiptLogo.png' if preview else '')
    if not isinstance(logo, str) or not logo:
        raise ValueError('Production rendering requires an HTTPS or CID logoUrl')
    if not (preview and logo == 'billingReceiptLogo.png'):
        if logo.startswith('cid:'):
            if len(logo) <= 4 or any(c.isspace() for c in logo):
                raise ValueError('Invalid CID logo URL')
        else:
            https_url(logo)
    details = [('Invoice #', invoice)]
    if data['assignment'] == 'merchant':
        details.append(('Merchant', required('merchantName')))
    details += [('Description', description), ('Payment Type', 'Fixed-term Monthly' if data['recurring'] else 'One-time')]
    if data.get('includedData'):
        details.append(('Included Data', required('includedData')))
    schedule = ''
    if data['recurring']:
        count = data.get('installmentCount')
        if type(count) is not int or count < 1:
            raise ValueError('installmentCount must be a positive integer')
        details += [('Monthly Amount', required('monthlyAmount')), ('Installments', str(count)), ('Contract Total', required('contractTotal'))]
        schedule = ('Your first installment is payable now. At checkout, you will be asked to authorize automatic charges for the remaining monthly installments according to the billing schedule. Collection ends when all agreed installments have been paid.' if count > 1 else 'This contract has one installment, payable now. No further payments will be collected after it is paid.')
    expiry = ''
    if data.get('linkExpiryDate'):
        day = date.fromisoformat(required('linkExpiryDate'))
        expiry = 'Payment link expires: ' + day.strftime('%b %d, %Y') + '.'
    note = str(data.get('notes') or '').strip()
    esc = lambda value: escape(str(value), quote=True)
    rows = ''.join('<tr><th class="label" scope="row" width="42%" align="left" valign="top" style="padding:14px 12px 14px 0;border-bottom:1px solid #e5e7eb;font-weight:400;color:#6b7280;">' + esc(label) + '</th><td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid #e5e7eb;overflow-wrap:anywhere;word-break:break-word;">' + esc(value) + '</td></tr>' for label, value in details)
    paragraph = lambda value: '<p style="margin:20px 0 0;font-size:13px;line-height:21px;color:#6b7280;overflow-wrap:anywhere;">' + esc(value).replace('\n', '<br>') + '</p>' if value else ''
    values = dict(issuerName=esc(issuer), invoiceNumber=esc(invoice), amountDue=esc(amount), logoUrl=esc(logo), paymentUrl=esc(payment_url), preheader=esc(f'{amount} due · Invoice {invoice}'), detailRows=rows, scheduleSection=paragraph(schedule), notesSection=paragraph(note), expirySection='<p style="margin:0 0 16px;font-size:12px;line-height:19px;color:#6b7280;">'+esc(expiry)+'</p>' if expiry else '')
    values['invitationText'] = esc(invitation)
    values['portalAction'] = ('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td style="padding-top:12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#ffffff" style="border-radius:6px;mso-padding-alt:16px 24px;"><a class="cta" href="'+esc(portal_url)+'" style="display:block;padding:16px 24px;border:1px solid #18181b;border-radius:6px;background:#ffffff;color:#18181b;font-size:16px;line-height:20px;font-weight:700;text-decoration:none;">Access Merchant Portal</a></td></tr></table></td></tr></table>') if portal_url else ''
    values['portalFallback'] = ('<p style="margin:16px 0 4px;font-size:12px;line-height:19px;color:#6b7280;">Merchant Portal</p><p style="margin:0;font-size:12px;line-height:19px;word-break:break-all;overflow-wrap:anywhere;"><a href="'+esc(portal_url)+'" style="color:#2563eb;text-decoration:underline;word-break:break-all;">'+esc(portal_url)+'</a></p>') if portal_url else ''
    # The source template has a working image for direct browser previews.
    template = Path(__file__).with_name('billingPaymentLink.html').read_text(encoding='utf-8')
    html = Template(template.replace('src="billingReceiptLogo.png"', 'src="${logoUrl}"')).substitute(values)
    plain = '\n\n'.join(part for part in ['Paywizard | wizarPOS', 'Your Bill Is Ready', 'Hello,', invitation, f'Amount Due Now: {amount}', '\n'.join(f'{label}: {value}' for label, value in details), schedule, note, f'View Bill & Pay:\n{payment_url}', f'Access Merchant Portal:\n{portal_url}' if portal_url else '', expiry, 'If you have questions about this bill, please contact the sender.', f'{issuer}\nSent via Paywizard Billing System'] if part)
    return {'subject': f'Your Bill Is Ready — {invoice}', 'html': html, 'text': plain + '\n'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    message = render(json.loads(args.input.read_text(encoding='utf-8')), preview=args.preview)
    args.output.write_text(message['html'], encoding='utf-8')
    args.output.with_suffix('.txt').write_text(message['text'], encoding='utf-8')
    args.output.with_suffix('.subject.txt').write_text(message['subject'] + '\n', encoding='utf-8')

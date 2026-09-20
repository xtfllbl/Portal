from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[2]
TEMP=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_GET(self):
  p=urlsplit(self.path).path
  if p.startswith('/_export/'):
   f=TEMP/p.split('/')[-1]
   if not f.is_file():self.send_error(404);return
   b=f.read_bytes();self.send_response(200);self.send_header('Content-Type','text/javascript' if f.suffix=='.js' else 'text/html; charset=utf-8' if f.suffix=='.html' else 'application/json');self.end_headers();self.wfile.write(b);return
  if p.lstrip('/') in ['41.billing_setup.html','42.billing_payments.html','43.billing_payment_link.html','44.billing_overview.html']:
   s=(ROOT/p.lstrip('/')).read_text()
   s=s.replace('<head>','<head><script src="/_export/clock.js"></script>',1)
   s=s.replace('<script src="scripts/billing-store.js">','<script src="/_export/fixtures.js"></script><script src="scripts/billing-store.js">')
   s=s.replace('</body>','<script src="/_export/prepare.js"></script></body>')
   b=s.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b);return
  return super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()

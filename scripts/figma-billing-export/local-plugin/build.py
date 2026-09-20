"""Build the offline plugin bundle from the verified capture manifest."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
manifest = json.loads((ROOT / 'docs/design/billing-figma/figma-export-manifest.json').read_text())
data = {key: manifest[key] for key in ('sourceCommit', 'capturedOn', 'frames', 'fileKey')}
data['receiptId'] = '39:2'
(HERE / 'code.js').write_text('const CAPTURE = ' + json.dumps(data, ensure_ascii=False) + ';\n' + (HERE / 'engine.js').read_text())
print('Built', HERE / 'code.js')

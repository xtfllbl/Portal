# Terminal preview sources

The following original embedded PDF images and their soft masks were extracted with Poppler `pdfimages -png`. They are unmodified source assets; CSS applies each PDF's intrinsic mask and maps the live display onto the photographed screen.

| Assets | Source | PDF objects | Display specification |
|---|---|---|---|
| `q3v-body.png`, `q3v-mask.png` | `/Users/beaver/Wizard/机具/datasheet/datasheet-Q3V (UPT)英文.pdf`, page 1 | Image object 53 and its soft mask | 4-inch LCD, 480 × 800 |
| `q3min-body.png`, `q3min-mask.png` | `/Users/beaver/Wizard/机具/datasheet/datasheet-Q3 min NAMA.pdf`, page 1 | Image object 67 and its soft mask | 4-inch LCD, 480 × 480 |

The PDF identifies the portrait product as UPT; the preview uses the user's filename designation Q3V (UPT). Model selection is a preview preference, not terminal targeting metadata. The native display dimensions and photo screen corners live in `scripts/advertising-preview.js`.

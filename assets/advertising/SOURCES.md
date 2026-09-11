# Terminal preview sources

The following original embedded PDF images and their soft masks were extracted with Poppler `pdfimages -png`. They are retained unchanged as references for the device designs.

| Assets | Source | PDF objects | Display specification |
|---|---|---|---|
| `q3v-body.png`, `q3v-mask.png` | `/Users/beaver/Wizard/机具/datasheet/datasheet-Q3V (UPT)英文.pdf`, page 1 | Image object 53 and its soft mask | 4-inch LCD, 480 × 800 |
| `q3min-body.png`, `q3min-mask.png` | `/Users/beaver/Wizard/机具/datasheet/datasheet-Q3 min NAMA.pdf`, page 1 | Image object 67 and its soft mask | 4-inch LCD, 480 × 480 |

The PDF identifies the portrait product as UPT; the preview uses the user's filename designation Q3V (UPT). Model selection is a preview preference, not terminal targeting metadata. The native display dimensions and photo screen corners live in `scripts/advertising-preview.js`.

## Current preview view assets

`q3v-supplied-front.png` is the current Q3V preview frame source: a byte-for-byte copy of the user's 2160 × 2634 photograph of the terminal mounted on a vending machine, supplied on 2026-09-11.

- Source: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-b8a19e45-b51b-4470-ad2c-d0f6f566fbd9.png`.
- The browser clips the surrounding vending machine with a vector outline. The source bitmap is unmodified; the housing texture, camera, sensors, Android controls and card slot use the original photograph. No generated repainting, mirroring or unequal scaling is applied.
- The preview viewport is `x: 850, y: 700, width: 968, height: 1438`. The source outline and screen coordinates are recorded together in the Q3V model in `scripts/advertising-preview.js`.
- The live LCD is exactly 480 × 800 and maps to a 453 × 755 rectangle (`x: 1108–1561, y: 1034–1789`), preserving 3:5 with equal horizontal and vertical scale. This covers the old cashier UI, including its antialiased edge pixels. The Android strip remains outside the live display. Advertising content follows the configured contain/cover mode within that screen.

`q3min-left.png` remains the accepted left-facing illustrative view made from the Q3min PDF reference with the built-in image generation tool. Its asset, viewport crop, and 480 × 480 display projection are unchanged. It uses its own opaque pale-gray background, without the PDF mask.

The rejected generated slim frame (`q3v-front-slim.png`), earlier Q3V side-view assets (`q3v-left.png`, `q3v-left-refined.png`, and `q3v-supplied-left.png`) and original multiview sheet (`q3v-supplied-views.png`) are retained as references. Historical generation prompts are in [VIEW_PROMPTS.md](VIEW_PROMPTS.md).

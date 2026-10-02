# EPC QR Generator

An EPC / GiroCode QR generator: paste invoice text, choose an image or take a camera photo, and the
payment fields (payee, IBAN, BIC, amount, reference) are filled automatically. The resulting QR code
can be scanned or imported by a banking app to pre-fill a SEPA transfer.

## Privacy
- Everything runs in the browser. Nothing you paste or photograph is uploaded anywhere.
- The OCR and QR-reading libraries are downloaded from jsDelivr the first time you use an image;
  only library code is fetched, never your data.

## Build and deploy
1. Edit `src/index.template.html`.
2. Run `node src/build.js` (writes `index.html`).
3. Commit and push to `main`. GitHub Pages publishes it in about a minute.

## Third-party code
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 by Kazuhiko Arase, MIT, inlined into `index.html`
- [jsQR](https://github.com/cozmo/jsQR) 1.4.0, Apache-2.0, loaded from jsDelivr
- [tesseract.js](https://github.com/naptha/tesseract.js) 5.1.1, Apache-2.0, loaded from jsDelivr

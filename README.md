# EPC QR Generator — `https://epc.loevdahl.com`

Turns an invoice into a **GiroCode** (EPC QR) that a banking app can import to pre-fill a SEPA transfer.
Input is whatever is at hand: pasted text, a screenshot, a phone photo, or a PDF. The page reads it,
fills the payment fields (payee, IBAN, amount, reference), and draws the QR. The user checks the fields, taps
**Download PNG**, and imports the PNG in the bank app ("scan from gallery").

One static file (`index.html`), no server, no build step on the host.

## Privacy
- Everything runs in the browser. Pasted text, photos and PDFs are **never uploaded**.
- Libraries load from jsDelivr the first time they are needed (QR reader on first image, text
  recognition on first OCR, PDF reader on first PDF). Only library code is fetched, never user data.
  Offline, pasted text still works; images and PDFs need the network once per browser session.
- The repo is public and holds no secrets or personal data. Example text in the page is dummy data. Keep it that way: never commit a real invoice, IBAN or name, not even as a test fixture.

## How it reads a document

Each input **adds to** the first box (it never replaces it); the fields are re-read from the whole box.
Clear all wipes everything. Press Clear between invoices.

| Input | What happens |
|---|---|
| Pasted / typed text | Parsed directly |
| PDF with a text layer | Text taken from the PDF (pdf.js), no OCR. Pages 1–5 |
| Scanned PDF (no text) | Pages 1–5 rendered to images, then treated as images |
| Image / photo / screenshot | 1. Look for an existing GiroCode (jsQR, on a copy ≤1600 px). If found, its data is exact, no OCR.<br>2. Otherwise OCR (Tesseract.js, German + English), then the OCR clean-up, then parse |
| Camera, phone | The phone's own camera app (sharpest, autofocus) → image path |
| Camera, laptop | Live view that auto-reads a GiroCode, or *Capture* → image path |

### Image preparation (measured on a real invoice and a till receipt, 2026-10-03)
- Phone photos are 12 MP+ and freeze the page, so they are scaled first: ≤1600 px for the QR scan,
  ~2400 px for OCR.
- Pages (aspect ≤ 1.7): auto layout, colour, ~2400 px. Narrow tall images such as receipts
  (aspect > 1.7): single-block layout, greyscale with stretched contrast, up to 2900 px.
- A bigger "best" language model made no measurable difference, so the small default one is used.

### OCR clean-up (`cleanOcr`) — only applied to OCR output, never to pasted or PDF text
Fixes the mistakes Tesseract makes systematically:
- `ß` read as `B` (`JohannisstraBe`, `DieBen`) and `ü` read as `ii` (`Schiirer`, `fiir`); `stratie` → `straße`.
- `Gmbh`, `GrnbH`, `GmbI-I` → `GmbH`.
- Web and e-mail addresses: `www. x. de` → `www.x.de`, `abcéxyz. de` → `abc@xyz.de`.
- Rule lines and borders (`_ _ _`, `===`, `~`), `Belegnu~~er` → `Belegnummer`, spaced capitals
  `C-U-S-T-O-M-E-R`, `10 ,00` → `10,00`.
- It cannot fix a genuinely misread word (`autopgnbh`). Add a rule only for systematic mistakes.

## How it fills the fields (`parse`)

Labelled values win; otherwise a content-based guess, which is flagged "Guessed from content, please check".

| Field | Rules |
|---|---|
| **IBAN** | Candidate = two letters + two digits + up to 32 alphanumerics, **only real IBAN country codes** (a vehicle type + VIN like `ED54QM WVWZZZ…` can pass the checksum by chance). Must pass mod-97 and the country's length. OCR confusions fixed for numeric-account countries (O→0, I/L→1, S→5, B→8). First valid IBAN is used; any others are offered as buttons. |
| **Payee** | Labelled (`Zahlungsempfänger`, `Kontoinhaber`, …), else the company line (legal form: GmbH, AG, KG, e.V., …; not a bank) nearest the IBAN. `& Co.` at the end gets `KG` appended. Other candidates are offered as buttons. |
| **Amount** | 1. A totals table: a line with `Gesamt-Betrag` / `Rechnungsbetrag` / `Endbetrag` … and no number, followed by a values row → the **last** number of that row.<br>2. A total label followed by a number on the same line (`USt.-Betrag`, `MwSt.` excluded).<br>3. A number with `EUR`/`€`.<br>4. Else the largest money number ≤ 999.<br>**Money needs two decimals** (`110,00`), so article numbers (`98440525`) are never amounts. **Over 999 €** shows a warning. Other amounts found are offered as buttons. |
| **Reference** | `Verwendungszweck`/`Zahlungsreferenz` if present; else `Rechnungsnr. … Kundennr. …` (also Vertrags-, Mitglieds-, Steuernr., Aktenzeichen, Kassenzeichen). The first match **with a digit** counts, so "Kunden-Nr. angeben" does not hide "Kunden Nr.: 523014". |
| **BIC** | **Not used.** Optional for SEPA in the euro area; the QR carries an empty BIC line. Reading it only added a way to be wrong. |

Also handled: PDFs that copy as a column of labels followed by a column of values are re-paired by position (`repairColumns`).

## The QR
EPC v002, `BCD / 002 / 1 / SCT / (BIC empty) / payee / IBAN / EURx.xx / (purpose) / (structured ref) / reference`.
UTF-8, error correction **M**, max 331 bytes (the page refuses a longer payload). Payee ≤ 70
characters, reference ≤ 140. **Download PNG** and **Copy IBAN** work on the shown QR.

## Hosting and deploy
- **Repo:** `github.com/Aron-82/epc-qr` (public, branch `main`). **Host:** GitHub Pages, HTTPS enforced.
- **DNS:** one CNAME `epc` → `aron-82.github.io` at Porkbun, plus GitHub's domain-verification TXT
  `_github-pages-challenge-aron-82`. No mail record is touched.
- **To change the page:**
  1. Edit `src/index.template.html` (never `index.html`, it is generated).
  2. `node src/build.js` (inlines the QR library, writes `index.html`).
  3. Check the scripts still parse and the page works.
  4. `git add -A; git commit; git push` → live in about a minute. The `CNAME` file in the repo must stay.
- **Gotchas:**
  - GitHub requests the HTTPS certificate when the custom domain is saved. If the DNS record does not
    exist yet, it never retries. Fix: clear the custom domain, save it again, wait for `approved`.
  - Editing Python/JS regexes through shell heredocs mangled backslashes twice (`\r?\n`
    became a literal newline). Check `node -e "new Function(<script>)"` after every edit.

## How it was tested (2026-10-02/03)
- Phone: text, image, camera, PDF, saved PNG imported by the bank app, all OK.
- Real documents: a car-workshop invoice (two bank accounts, VIN in the header, article numbers) and a
  till receipt. Parser regressions to rerun after changes: IBAN not taken from the VIN; amount 110,00
  from the totals row; customer number in the reference; second IBAN offered.
- OCR experiments ran Tesseract.js in Node on the same images (variants: model, scale, grey, layout mode).

## Known limits
- OCR is only as good as the image: thermal receipts and small print still produce wrong letters.
- Which of two bank accounts to pay is not decidable from the text. The first is used, the other is one tap away.
- Only the first 5 PDF pages are read.
- A card receipt (already paid) has no IBAN; the page shows what it read and no QR.

## Third-party code
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 by Kazuhiko Arase, MIT, inlined into `index.html`
- [jsQR](https://github.com/cozmo/jsQR) 1.4.0, Apache-2.0, from jsDelivr
- [tesseract.js](https://github.com/naptha/tesseract.js) 5.1.1, Apache-2.0, from jsDelivr (language data downloaded on first OCR, about 10 MB)
- [pdf.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist` 3.11.174), Apache-2.0, from jsDelivr

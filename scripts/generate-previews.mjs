// Turns the first page of every PDF in public/certificates/ into a JPG preview in
// public/previews/. Runs automatically before `npm run dev` and `npm run build`, so
// visitors' browsers only ever load lightweight images instead of rendering PDFs.
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const SOURCE = 'public/certificates';
const OUTPUT = 'public/previews';
const WIDTH = 1600; // px. Sharp in the detail view, still small on disk.
const PDFJS_ASSETS = path.resolve('node_modules/pdfjs-dist') + '/';

fs.mkdirSync(OUTPUT, { recursive: true });

const pdfs = fs.readdirSync(SOURCE).filter((f) => f.toLowerCase().endsWith('.pdf'));
let generated = 0;

for (const file of pdfs) {
  const source = path.join(SOURCE, file);
  const target = path.join(OUTPUT, file.replace(/\.pdf$/i, '.jpg'));
  // Skip PDFs whose preview is already up to date.
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs) continue;

  const task = pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(source)),
    wasmUrl: `${PDFJS_ASSETS}wasm/`,
    standardFontDataUrl: `${PDFJS_ASSETS}standard_fonts/`,
    cMapUrl: `${PDFJS_ASSETS}cmaps/`,
    iccUrl: `${PDFJS_ASSETS}iccs/`,
    verbosity: 0,
  });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: WIDTH / page.getViewport({ scale: 1 }).width });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // PDFs can have transparent backgrounds; JPG can't.
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, viewport }).promise;
  fs.writeFileSync(target, await canvas.encode('jpeg', 82));
  await task.destroy();
  generated++;
}

console.log(`Previews: ${generated} generated, ${pdfs.length - generated} up to date.`);

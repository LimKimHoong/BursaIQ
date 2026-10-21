import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation } from '@oai/artifact-tool';
import { installNode } from '@oai/granola/node';

installNode();

const source = '/Users/kimhoong0324/Downloads/BursaIQ_Pitch_Technical.pptx';
const outDir = '/Users/kimhoong0324/Desktop/BursaIQ-main/.codex-deck-build/source-render';
await fs.mkdir(outDir, { recursive: true });
const deck = await Presentation.load(source);
const inspection = await deck.inspect({
  select: '$.slides[*]',
  include: ['id', 'index', 'layout', 'title', 'elements.id', 'elements.kind', 'elements.name', 'elements.text', 'elements.alt', 'elements.position', 'elements.style', 'notes.text'],
});
await fs.writeFile(path.join(outDir, 'content.ndjson'), inspection.ndjson);
const summary = {
  slideCount: deck.slides.length,
  slideSize: deck.slideSize,
  masters: deck.masters.items.map((m) => ({ id: m.id, name: m.name })),
  layouts: deck.layouts.items.map((l) => ({ id: l.id, name: l.name, parentLayoutId: l.parentLayoutId, placeholders: l.placeholders.summary() })),
};
await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
for (let i = 0; i < deck.slides.length; i += 1) {
  const slide = deck.slides.getItemAt(i);
  const png = await slide.export({ format: 'png', scale: 1.5 });
  await fs.writeFile(path.join(outDir, `slide-${i + 1}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: 'layout', detail: 'full' });
  await fs.writeFile(path.join(outDir, `slide-${i + 1}.layout.json`), await layout.text());
}
const montage = await deck.export({ format: 'webp', montage: true, scale: 0.8 });
await fs.writeFile(path.join(outDir, 'montage.webp'), new Uint8Array(await montage.arrayBuffer()));
console.log(JSON.stringify(summary, null, 2));

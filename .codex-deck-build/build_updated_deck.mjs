import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'BursaIQ';
pptx.subject = 'Technical architecture and implemented feature overview';
pptx.title = 'BursaIQ — Technical Architecture & Implemented Platform';
pptx.company = 'BursaIQ';
pptx.lang = 'en-MY';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-MY',
};
pptx.defineSlideMaster({
  title: 'TECH',
  background: { color: 'F7FAFC' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: '0B5FFF' }, line: { color: '0B5FFF' } } },
    { text: { text: 'BursaIQ  ·  Technical Architecture', options: { x: 0.42, y: 7.13, w: 4.1, h: 0.18, fontFace: 'Aptos', fontSize: 8.5, color: '667085', margin: 0 } } },
  ],
  slideNumber: { x: 12.45, y: 7.12, w: 0.42, h: 0.18, fontFace: 'Aptos', fontSize: 8.5, color: '667085', align: 'right', margin: 0 },
});

const C = {
  navy: '092A5E', blue: '0B5FFF', cyan: '14B8D4', teal: '19B7A5', purple: '7A5AF8',
  ink: '14213D', muted: '667085', line: 'D7E0EC', pale: 'EDF4FF', mint: 'E8F8F5',
  violet: 'F1EEFF', amber: 'F59E0B', amberPale: 'FFF5D9', white: 'FFFFFF', red: 'D92D20',
};
const sh = pptx.ShapeType;

function addTitle(slide, kicker, title, subtitle) {
  slide.addText(kicker.toUpperCase(), { x: 0.48, y: 0.30, w: 2.8, h: 0.22, fontSize: 9.5, bold: true, color: C.blue, charSpacing: 1.1, margin: 0 });
  slide.addText(title, { x: 0.48, y: 0.70, w: 12.25, h: 0.50, fontSize: 25.5, bold: true, color: C.navy, margin: 0, breakLine: false, fit: 'shrink' });
  if (subtitle) slide.addText(subtitle, { x: 0.50, y: 1.28, w: 12.1, h: 0.28, fontSize: 11.8, color: C.muted, margin: 0, fit: 'shrink' });
}
function pill(slide, text, x, y, w, fill = C.pale, color = C.blue) {
  slide.addShape(sh.roundRect, { x, y, w, h: 0.30, rectRadius: 0.08, fill: { color: fill }, line: { color: fill } });
  slide.addText(text, { x: x + 0.10, y: y + 0.075, w: w - 0.20, h: 0.13, fontSize: 8.7, bold: true, color, align: 'center', margin: 0, fit: 'shrink' });
}
function card(slide, x, y, w, h, title, body, accent = C.blue, tag) {
  slide.addShape(sh.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 0.8 }, shadow: { type: 'outer', color: 'B9C6D8', opacity: 0.14, blur: 1.2, angle: 45, distance: 1 } });
  slide.addShape(sh.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  if (tag) pill(slide, tag, x + 0.20, y + 0.17, Math.min(1.30, w - 0.4), accent === C.teal ? C.mint : accent === C.purple ? C.violet : C.pale, accent);
  const ty = tag ? y + 0.54 : y + 0.22;
  slide.addText(title, { x: x + 0.20, y: ty, w: w - 0.38, h: 0.28, fontSize: 13.2, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.20, y: ty + 0.33, w: w - 0.38, h: Math.max(0.22, h - (ty - y) - 0.40), fontSize: 8.2, color: C.muted, margin: 0, breakLine: false, valign: 'top', paraSpaceAfterPt: 2, fit: 'shrink' });
}
function flowBox(slide, x, y, w, h, n, title, body, fill, color = C.navy) {
  slide.addShape(sh.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: 'C8D5E6', width: 0.8 } });
  slide.addShape(sh.ellipse, { x: x + 0.13, y: y + 0.14, w: 0.34, h: 0.34, fill: { color }, line: { color } });
  slide.addText(String(n), { x: x + 0.13, y: y + 0.22, w: 0.34, h: 0.11, fontSize: 8.5, bold: true, color: C.white, align: 'center', margin: 0 });
  slide.addText(title, { x: x + 0.54, y: y + 0.14, w: w - 0.68, h: 0.22, fontSize: 10.5, bold: true, color, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.14, y: y + 0.55, w: w - 0.28, h: h - 0.68, fontSize: 8.6, color: C.muted, margin: 0, fit: 'shrink', valign: 'top' });
}
function bulletRuns(items) {
  return items.map((text, i) => ({ text, options: { bullet: { indent: 12 }, hanging: 3, breakLine: i < items.length - 1, paraSpaceAfterPt: 5 } }));
}

// 1 — Cover
{
  const s = pptx.addSlide('TECH');
  s.background = { color: C.navy };
  s.addShape(sh.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.navy }, line: { color: C.navy } });
  s.addShape(sh.arc, { x: 8.65, y: -1.15, w: 5.8, h: 5.8, adjustPoint: 0.35, rotate: 20, fill: { color: C.navy, transparency: 100 }, line: { color: '1B70E8', transparency: 25, width: 3.4 } });
  s.addShape(sh.arc, { x: 9.30, y: 3.15, w: 4.9, h: 4.9, adjustPoint: 0.35, rotate: 205, fill: { color: C.navy, transparency: 100 }, line: { color: C.cyan, transparency: 35, width: 2.2 } });
  s.addText('BursaIQ', { x: 0.62, y: 0.56, w: 2.2, h: 0.40, fontSize: 22, bold: true, color: C.white, margin: 0 });
  pill(s, 'REPOSITORY-ALIGNED · OCT 2026', 0.64, 1.54, 2.75, '123B70', 'B9D6FF');
  s.addText('Technical Architecture\n& Implemented Platform', { x: 0.62, y: 2.03, w: 7.6, h: 1.35, fontSize: 35, bold: true, color: C.white, margin: 0, breakLine: false, fit: 'shrink' });
  s.addText('Flask APIs, governed AI execution, deterministic analytics, role-filtered knowledge, human approval and reusable intelligence—implemented as one local prototype.', { x: 0.65, y: 3.60, w: 7.15, h: 0.82, fontSize: 15.2, color: 'D8E5F7', margin: 0, fit: 'shrink' });
  const tags = [
    ['Python 3.11+', C.cyan], ['Flask', C.blue], ['SQLite', C.teal], ['JavaScript', C.purple],
    ['Ollama', C.cyan], ['Copilot Studio', C.blue], ['RAG', C.teal], ['PDF output', C.purple]
  ];
  tags.forEach(([t, c], i) => pill(s, t, 0.65 + (i % 4) * 1.48, 5.04 + Math.floor(i / 4) * 0.48, 1.28, '123B70', c));
  s.addText('Scope: code architecture, feature wiring, data paths, governance controls and demo boundaries', { x: 0.65, y: 6.40, w: 8.5, h: 0.28, fontSize: 10.5, color: '91A8C8', margin: 0 });
}

// 2 — Product surface map
{
  const s = pptx.addSlide('TECH');
  addTitle(s, 'Implemented surface', 'Twelve connected pages share one governed backend', 'Navigation is grouped by execution, follow-through and administration; all stateful features persist through Flask APIs.');
  const xs = [0.50, 3.10, 5.70, 8.30, 10.90];
  const w = 2.35, h = 1.18;
  card(s, xs[0], 1.82, w, h, 'Home', 'Live semantic routing to conversational Q&A or an active registered mission capability.', C.blue, 'ENTRY');
  card(s, xs[1], 1.82, w, h, 'AI Assistant', 'Live answers, evidence, metrics and hybrid HTML/SVG analytics charts.', C.blue, 'EXECUTE');
  card(s, xs[2], 1.82, w, h, 'Ask Bursa', 'Role-filtered RAG over indexed documents with citations and source-scope disclosure.', C.blue, 'KNOWLEDGE');
  card(s, xs[3], 1.82, w, h, 'My Workforce', 'Governed missions, worker stages, agents, teams and capabilities.', C.blue, 'MISSIONS');
  card(s, xs[4], 1.82, w, h, 'Collaborative Rooms', 'Persisted rooms, tasks, files, AI teammates and decisions.', C.blue, 'COLLAB');
  card(s, 0.50, 3.28, w, h, 'Automation Studio', 'Persisted visual workflows with validation, retries, approvals and resumable runs.', C.blue, 'WORKFLOW');
  card(s, 3.10, 3.28, w, h, 'Intelligence Exchange', 'Approved, versioned assets with provenance and traceable reuse as a new mission.', C.blue, 'REUSE');
  card(s, 5.70, 3.28, w, h, 'Action', 'Backend-derived attention queue, decision memory and reviewable email schedules.', C.purple, 'FOLLOW-UP');
  card(s, 8.30, 3.28, w, h, 'Verification Centre', 'Review, approval, requested changes, resubmission and audit history.', C.purple, 'GOVERN');
  card(s, 10.90, 3.28, w, h, 'Knowledge Admin', 'Upload, metadata, permissions, indexing, failures, removal and suggestions.', C.teal, 'ADMIN');
  card(s, 0.50, 4.74, w, h, 'Connectors', 'Governed requests; external access stays unavailable until configured.', C.teal, 'ADMIN');
  card(s, 3.10, 4.74, w, h, 'Settings', 'Local preferences and live model-provider availability.', C.teal, 'PLATFORM');
  s.addShape(sh.roundRect, { x: 5.70, y: 4.74, w: 7.55, h: 1.18, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText('Shared rendering contract', { x: 6.0, y: 4.96, w: 2.2, h: 0.24, fontSize: 13.2, bold: true, color: C.white, margin: 0 });
  s.addText('Summary metrics · tables · charts · findings · evidence · quality checks · interpretation boundaries · downloadable outputs', { x: 6.0, y: 5.37, w: 6.85, h: 0.30, fontSize: 10.4, color: 'D8E5F7', margin: 0, fit: 'shrink' });
  s.addShape(sh.line, { x: 0.50, y: 6.34, w: 12.35, h: 0, line: { color: C.line, width: 1 } });
  s.addText('All surfaces are implemented in index.html + static/js/workforce.js and backed by server.py / bursaiq modules.', { x: 0.52, y: 6.51, w: 10.8, h: 0.28, fontSize: 10.2, color: C.muted, margin: 0 });
}

// 3 — Architecture
{
  const s = pptx.addSlide('TECH');
  addTitle(s, 'Design architecture', 'Layered system with explicit execution and trust boundaries', 'The model interprets intent and generates language; Python owns capability allowlisting, deterministic analytics, validation, persistence and reports.');
  const y = [1.76, 2.68, 3.60, 4.52, 5.44];
  // connectors first
  for (let i = 0; i < 4; i++) s.addShape(sh.line, { x: 6.66, y: y[i] + 0.72, w: 0, h: 0.20, line: { color: '91A8C8', width: 1.6, beginArrowType: 'none', endArrowType: 'triangle' } });
  s.addShape(sh.line, { x: 8.55, y: 4.05, w: 1.05, h: 0, line: { color: '91A8C8', width: 1.4, endArrowType: 'triangle' } });
  s.addShape(sh.line, { x: 9.58, y: 4.05, w: -1.03, h: 0, line: { color: '91A8C8', width: 1.4, endArrowType: 'triangle' } });
  const layers = [
    ['1', 'Browser interface', 'Responsive HTML/CSS/JavaScript · 11 pages · safe Markdown · HTML/SVG analytics charts', C.pale, C.blue],
    ['2', 'Flask API boundary', 'Routing, request validation, role checks, provider gateway and feature-specific APIs', 'EAF3FF', C.blue],
    ['3', 'Orchestration & governance', 'Mission engine · Agent Registry · teams · Capability Registry · workflow engine · approval gates', C.violet, C.purple],
    ['4', 'Execution services', 'Allowlisted Python executors · RAG · PDF generation · model providers · structured result validation', C.mint, C.teal],
    ['5', 'State & governed assets', 'SQLite runtime store · controlled knowledge files · synthetic CSV inputs · output/pdf deliverables', 'EEF1F6', C.navy],
  ];
  layers.forEach(([n, title, body, fill, accent], i) => {
    s.addShape(sh.roundRect, { x: 0.55, y: y[i], w: 8.0, h: 0.72, rectRadius: 0.06, fill: { color: fill }, line: { color: 'C8D5E6', width: 0.7 } });
    s.addShape(sh.ellipse, { x: 0.72, y: y[i] + 0.16, w: 0.38, h: 0.38, fill: { color: accent }, line: { color: accent } });
    s.addText(n, { x: 0.72, y: y[i] + 0.25, w: 0.38, h: 0.11, fontSize: 8.5, bold: true, color: C.white, align: 'center', margin: 0 });
    s.addText(title, { x: 1.24, y: y[i] + 0.13, w: 2.2, h: 0.20, fontSize: 11.5, bold: true, color: C.navy, margin: 0 });
    s.addText(body, { x: 3.15, y: y[i] + 0.13, w: 5.10, h: 0.42, fontSize: 9.3, color: C.muted, margin: 0, fit: 'shrink', valign: 'mid' });
  });
  card(s, 9.05, 1.76, 3.72, 1.12, 'Model providers', 'Ollama: qwen2.5:3b + nomic-embed-text\nCopilot Studio: server-side Direct Line token exchange', C.blue, 'LANGUAGE');
  card(s, 9.05, 3.23, 3.72, 1.46, 'Capability safety boundary', 'A registry record cannot install code. Only executor IDs in MISSION_EXECUTORS can run; missing, disabled, changed or input-incomplete contracts are rejected.', C.purple, 'ALLOWLIST');
  card(s, 9.05, 5.04, 3.72, 1.12, 'Persistence boundary', 'SQLite persists governed platform state. Local Analysis uploads remain in memory; reports are written to output/pdf/.', C.teal, 'STATE');
  pill(s, 'NO SECRETS IN BROWSER', 9.35, 6.43, 1.86, C.amberPale, 'A45A00');
  pill(s, 'NO SILENT FAKE SUCCESS', 11.28, 6.43, 1.60, C.amberPale, 'A45A00');
}

// 4 — Runtime and governance flow
{
  const s = pptx.addSlide('TECH');
  addTitle(s, 'Runtime behavior', 'One request can become a governed, reusable technical artifact', 'Execution freezes the selected capability, team and agent versions; approval and reuse retain provenance.');
  const boxes = [
    ['Request', 'Home or New AI Mission'],
    ['Route', 'Live provider classifies intent'],
    ['Validate', 'Capability, files, team, agents'],
    ['Execute', 'Allowlisted deterministic Python'],
    ['Review', 'Approve or request changes'],
    ['Publish', 'Versioned Exchange asset'],
    ['Reuse', 'New mission with provenance'],
  ];
  const x0 = 0.48, bw = 1.68, gap = 0.15, by = 2.02;
  for (let i = 0; i < boxes.length - 1; i++) s.addShape(sh.line, { x: x0 + bw + i * (bw + gap), y: by + 0.59, w: gap, h: 0, line: { color: '8CA6C7', width: 1.5, endArrowType: 'triangle' } });
  boxes.forEach(([t, b], i) => flowBox(s, x0 + i * (bw + gap), by, bw, 1.20, i + 1, t, b, i < 2 ? C.pale : i < 4 ? C.violet : i < 6 ? C.mint : 'EEF1F6', i < 2 ? C.blue : i < 4 ? C.purple : i < 6 ? C.teal : C.navy));
  s.addText('Workflow Builder', { x: 0.50, y: 3.73, w: 2.1, h: 0.28, fontSize: 14, bold: true, color: C.navy, margin: 0 });
  s.addText('Persisted node graph and run state', { x: 0.50, y: 4.10, w: 2.2, h: 0.22, fontSize: 9.3, color: C.muted, margin: 0 });
  const wx = 2.90, wy = 3.78, ww = 1.31, wh = 0.62, wg = 0.20;
  const nodes = ['Trigger', 'Gather Data', 'AI Agent', 'Condition', 'Human Approval', 'Generate Report', 'Publish / Send'];
  for (let i = 0; i < nodes.length - 1; i++) s.addShape(sh.line, { x: wx + ww + i * (ww + wg), y: wy + wh / 2, w: wg, h: 0, line: { color: '8CA6C7', width: 1.25, endArrowType: 'triangle' } });
  nodes.forEach((n, i) => {
    const fill = i === 4 ? C.amberPale : i >= 5 ? C.mint : C.white;
    const accent = i === 4 ? C.amber : i >= 5 ? C.teal : C.blue;
    s.addShape(sh.roundRect, { x: wx + i * (ww + wg), y: wy, w: ww, h: wh, rectRadius: 0.05, fill: { color: fill }, line: { color: accent, width: 1.1 } });
    s.addText(n, { x: wx + 0.08 + i * (ww + wg), y: wy + 0.20, w: ww - 0.16, h: 0.15, fontSize: 8.7, bold: true, color: accent, align: 'center', margin: 0, fit: 'shrink' });
  });
  card(s, 0.50, 4.83, 3.85, 1.25, 'Human approval is resumable', 'Workflow approval uses the same review queue. A valid decision resumes the original run at the next node; repeated decisions are rejected.', C.purple);
  card(s, 4.55, 4.83, 3.85, 1.25, 'Result envelope is schema-driven', 'Metrics, tables, charts, evidence, quality checks and boundaries render consistently across Assistant, Workforce and Verification.', C.blue);
  card(s, 8.60, 4.83, 4.20, 1.25, 'Unsupported integrations fail honestly', 'Publish / Send only executes an explicitly supported integration. Unconfigured external send paths are blocked and recorded as unavailable.', C.teal);
}

// 5 — Stack, data and boundaries
{
  const s = pptx.addSlide('TECH');
  addTitle(s, 'Implementation snapshot', 'Technology stack, data contracts and current demo boundaries', 'This slide replaces the business-comparison content with what the repository actually runs and validates.');
  card(s, 0.52, 1.75, 3.82, 1.75, 'Application stack', '', C.blue, 'RUNTIME');
  s.addText(bulletRuns(['Python 3.11+ / Flask service', 'Responsive vanilla JavaScript frontend', 'SQLite persistence', 'Node.js frontend contract tests', 'PDF generation and validation']), { x: 0.78, y: 2.68, w: 3.25, h: 0.62, fontSize: 9.2, color: C.ink, margin: 0.02, breakLine: false, fit: 'shrink' });
  card(s, 4.56, 1.75, 3.82, 1.75, 'AI and knowledge', '', C.purple, 'PROVIDERS');
  s.addText(bulletRuns(['Ollama generation + embeddings', 'Microsoft Copilot Studio / Direct Line', 'Role-filtered document retrieval', 'PDF, Office, CSV, text, Markdown, HTML', 'No OCR for image-only PDFs']), { x: 4.82, y: 2.68, w: 3.25, h: 0.62, fontSize: 9.2, color: C.ink, margin: 0.02, fit: 'shrink' });
  card(s, 8.60, 1.75, 4.20, 1.75, 'Registered analytics', '', C.teal, 'EXECUTORS');
  s.addText(bulletRuns(['ADV / investor participation analysis', 'Security liquidity and turnover analysis', 'market_trades_demo.csv', 'investor_participation_demo.csv', 'daily_security_trading_demo.csv']), { x: 8.88, y: 2.68, w: 3.58, h: 0.62, fontSize: 9.2, color: C.ink, margin: 0.02, fit: 'shrink' });
  s.addShape(sh.roundRect, { x: 0.52, y: 3.84, w: 7.86, h: 2.15, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 0.8 } });
  s.addText('Persistence map', { x: 0.78, y: 4.10, w: 2.0, h: 0.28, fontSize: 14, bold: true, color: C.navy, margin: 0 });
  const rows = [
    ['SQLite', 'missions, versions, worker events, agents, teams, capabilities, workflows, rooms, approvals, settings, RAG chunks'],
    ['Filesystem', 'controlled knowledge sources, synthetic CSV inputs, generated PDF reports'],
    ['Memory only', 'Local Analysis uploads; cleared at process restart or session deletion'],
  ];
  rows.forEach(([k, v], i) => {
    const yy = 4.58 + i * 0.43;
    pill(s, k.toUpperCase(), 0.78, yy, 1.17, i === 0 ? C.pale : i === 1 ? C.mint : C.violet, i === 0 ? C.blue : i === 1 ? C.teal : C.purple);
    s.addText(v, { x: 2.12, y: yy + 0.04, w: 5.90, h: 0.22, fontSize: 9.2, color: C.muted, margin: 0, fit: 'shrink' });
  });
  s.addShape(sh.roundRect, { x: 8.60, y: 3.84, w: 4.20, h: 2.15, rectRadius: 0.08, fill: { color: C.amberPale }, line: { color: 'F5C96A', width: 0.9 } });
  s.addText('Current boundaries', { x: 8.88, y: 4.10, w: 2.0, h: 0.28, fontSize: 14, bold: true, color: '874D00', margin: 0 });
  s.addText(bulletRuns(['Synthetic demonstration data and identities', 'Local role checks—not production SSO', 'External connectors require administrator configuration', 'Provider failures surface as unavailable', 'No production market feed is claimed']), { x: 8.88, y: 4.58, w: 3.57, h: 1.15, fontSize: 9.9, color: '694100', margin: 0.02, fit: 'shrink' });
  s.addShape(sh.line, { x: 0.52, y: 6.35, w: 12.28, h: 0, line: { color: C.line, width: 1 } });
  s.addText('Primary implementation: server.py · index.html · static/js/workforce.js · bursaiq/*.py', { x: 0.54, y: 6.52, w: 8.3, h: 0.25, fontSize: 9.6, color: C.muted, margin: 0 });
  pill(s, 'TECHNICAL DEMO — NOT MARKET GUIDANCE', 9.75, 6.48, 3.05, C.amberPale, '874D00');
}

await pptx.writeFile({ fileName: '/Users/kimhoong0324/Desktop/BursaIQ-main/output/presentations/BursaIQ_Pitch_Technical_Updated.pptx' });

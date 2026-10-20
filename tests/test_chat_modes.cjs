const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadApp(canvasOpen = false, navigation = null) {
  const calls = [];
  const context = vm.createContext({
    window: { setTimeout, clearTimeout, matchMedia: () => ({ matches: navigation?.mobile || false }) },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: navigation?.document || { addEventListener: () => {}, getElementById: (id) => id === 'evidence-panel' && canvasOpen ? { classList: { contains: () => false } } : null },
    HTMLElement: class {},
    AbortController,
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ workspace: 'market', answer: 'Connected reply', narrativeMode: 'copilot-studio', conversationId: 'live-thread' }) };
    }
  });
  const root = path.join(__dirname, '..', 'static', 'js');
  for (const name of ['demo-data.js', 'engine.js', 'automation.js']) vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context);
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace('document.addEventListener("DOMContentLoaded", init);', 'window.testAPI = { state, resolveAnswer, chatModeMarkup, answerActionsMarkup, closeNavigation };');
  vm.runInContext(source, context);
  return { ...context.window.testAPI, calls };
}

test('Local is the default and never calls Copilot even with a connected backend', async () => {
  const app = loadApp();
  app.state.backend = true;
  assert.equal(app.state.preferences.assistantMode, 'local');
  const answer = await app.resolveAnswer('How did the market perform in July?', 'home', 'gcmc');
  assert.equal(answer.result.narrativeMode, 'local-demo');
  assert.equal(app.calls.length, 0);
  assert.match(app.chatModeMarkup(), /option value="local" selected/);
});

test('Live sends a connected request and preserves real response provenance', async () => {
  const app = loadApp();
  app.state.backend = true;
  app.state.preferences.assistantMode = 'live';
  const answer = await app.resolveAnswer('How did the market perform in July?', 'home', 'gcmc');
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].url, '/api/chat');
  assert.equal(answer.result.narrativeMode, 'copilot-studio');
});

test('Disconnected Live is visibly a fallback, never claimed as live generation', async () => {
  const app = loadApp();
  app.state.preferences.assistantMode = 'live';
  const answer = await app.resolveAnswer('How did the market perform in July?', 'home', 'gcmc');
  assert.equal(answer.result.narrativeMode, 'fallback');
  assert.equal(app.calls.length, 0);
});

test('Learn Bursa remains Local regardless of Assistant selection', async () => {
  const app = loadApp();
  app.state.backend = true;
  app.state.preferences.assistantMode = 'live';
  const answer = await app.resolveAnswer('Explain ADV in plain language', 'learn', 'gcmc');
  assert.equal(answer.result.narrativeMode, 'local-demo');
  assert.equal(app.calls.length, 0);
});

test('Local enforces role restrictions and rejects unsupported questions', async () => {
  const app = loadApp();
  const restricted = await app.resolveAnswer('What is continuous disclosure?', 'reg', 'gcmc');
  assert.equal(restricted.denied, true);
  const unsupported = await app.resolveAnswer('Write a birthday poem', 'home', 'gcmc');
  assert.equal(unsupported.localError, true);
  assert.equal(app.calls.length, 0);
});

test('Every chat answer uses matching Canvas, Verify, PDF actions in that order', () => {
  const app = loadApp();
  for (const tab of ['plot', 'analysis']) {
    const html = app.answerActionsMarkup(tab);
    const actions = [...html.matchAll(/class="action-button[^\"]*"[^>]*data-answer-action="([^\"]+)"/g)].map(match => match[1]);
    assert.deepEqual(actions, ['canvas', 'verify', 'report']);
    assert.match(html, /aria-controls="evidence-panel" aria-expanded="false"/);
    assert.match(html, new RegExp(`data-insight-tab="${tab}"`));
    assert.doesNotMatch(html, /analysis-link|Read full answer|Explore chart/);
  }
});

test('A new answer reflects an already open Canvas', () => {
  assert.match(loadApp(true).answerActionsMarkup('analysis'), /aria-expanded="true"/);
});

test('Root page contains no global Canvas control or legacy answer links', () => {
  for (const directory of ['.']) {
    const root = path.join(__dirname, '..', directory);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(root, 'static/js/app.js'), 'utf8');
    assert.doesNotMatch(html + js, /decision-canvas-toggle|Read full answer and (?:sources|resources)|Explore chart and governed analysis|portrait-canvas-action/);
    assert.match(js, /\$\{narrative\}\$\{answerActionsMarkup\(defaultInsightTab\)\}/);
  }
});

test('Desktop sidebar shares the shell origin without changing the fixed mobile drawer', () => {
  for (const directory of ['.']) {
    const css = fs.readFileSync(path.join(__dirname, '..', directory, 'static/css/app.css'), 'utf8');
    assert.match(css, /\.app-shell \{ position: relative; grid-template-columns: 72px/);
    assert.match(css, /@media \(min-width: 981px\) \{\s*\.primary-sidebar \{ position: absolute; inset: 0 auto 0 0; \}/);
    assert.match(css, /\.primary-sidebar \{\s*position: fixed;/);
  }
});

test('Only the side-by-side Canvas view removes the extra chat-column divider', () => {
  for (const directory of ['.']) {
    const css = fs.readFileSync(path.join(__dirname, '..', directory, 'static/css/app.css'), 'utf8');
    assert.match(css, /@media \(min-width: 981px\) and \(orientation: landscape\) \{\s*\.workspace-grid\.has-evidence > \.conversation-panel \{ border-right: 0; \}/);
    assert.match(css, /\.conversation-panel \{ border-right: 1px solid var\(--line\); \}/);
    assert.match(css, /\.evidence-panel \{[\s\S]*?border-left: 1px solid var\(--line\)/);
  }
});

test('Page selection closes the desktop hover rail and moves focus out without scrolling', () => {
  for (const mobile of [false, true]) {
    const classes = new Set();
    let focusOptions;
    const active = {};
    const sidebar = {
      classList: { add: value => classes.add(value) },
      contains: element => element === active,
      matches: () => true,
      setAttribute: () => {}, removeAttribute: () => {}
    };
    const main = { focus: options => { focusOptions = options; } };
    const document = {
      activeElement: active, addEventListener: () => {},
      body: { classList: { contains: () => false, remove: () => {} } },
      getElementById: id => ({ 'primary-sidebar': sidebar, 'main-content': main })[id] || null,
      querySelector: () => ({})
    };
    loadApp(false, { mobile, document }).closeNavigation();
    assert.equal(classes.has('is-auto-closed'), !mobile);
    assert.equal(focusOptions?.preventScroll, mobile ? undefined : true);
  }
});

test('Root rail can reopen and retains reduced-motion handling', () => {
  for (const directory of ['.']) {
    const root = path.join(__dirname, '..', directory);
    const js = fs.readFileSync(path.join(root, 'static/js/app.js'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'static/css/app.css'), 'utf8');
    for (const event of ['pointerenter', 'focusin']) assert.ok(js.includes(`addEventListener("${event}", () => sidebar.classList.remove("is-auto-closed"))`));
    assert.ok(!js.includes('addEventListener("pointerleave", () => sidebar.classList.remove("is-auto-closed"))'));
    assert.match(css, /\.primary-sidebar\.is-auto-closed \{ clip-path: inset\(0 178px 0 0\); \}/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\) and \(min-width: 981px\)/);
  }
});

test('Research Lab naming matches across navigation, page heading and guide', () => {
  for (const directory of ['.']) {
    const root = path.join(__dirname, '..', directory);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(root, 'static/js/app.js'), 'utf8');
    assert.match(html, /<span>Research Lab<\/span>/);
    assert.match(js, /research: "Research Lab"/);
    assert.match(js, /label: "Open Research Lab"/);
    assert.doesNotMatch(js, /research: "Research"|label: "Open Research"/);
  }
});

test('Research instructions wrap and never require a horizontal scrollbar', () => {
  for (const directory of ['.']) {
    const css = fs.readFileSync(path.join(__dirname, '..', directory, 'static/css/app.css'), 'utf8');
    assert.match(css, /\.research-command textarea \{\s*display: block; min-width: 0; max-width: 100%; padding-inline: 8px;\s*white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal;\s*overflow-x: hidden; overflow-y: auto; scrollbar-width: none;/);
    assert.match(css, /\.research-command textarea::-webkit-scrollbar \{ display: none; width: 0; height: 0; \}/);
  }
});

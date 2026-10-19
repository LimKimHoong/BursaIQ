const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'static/js/workforce.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'static/css/workforce.css'), 'utf8');
const designDocs = fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8');
const designLibrary = fs.readFileSync(path.join(root, '.impeccable/design.json'), 'utf8');

test('the complete platform modules have dedicated renderers', () => {
  for (const name of ['workspacePage', 'briefPage', 'verificationPage', 'connectorsPage', 'settingsPage']) {
    assert.match(js, new RegExp(`function ${name}\\(`));
  }
  assert.doesNotMatch(js, /else html = placeholderPage/);
});

test('every major action family has an interaction handler', () => {
  for (const hook of [
    'data-demo-action', 'data-create', 'data-asset-open', 'data-agent-open',
    'data-mission', 'data-automation-tab', 'data-room-tab', 'data-workspace-view',
    'data-connector', 'data-setting-toggle'
  ]) {
    assert.match(js, new RegExp(`\\[${hook}\\]`));
  }
});

test('creation and detail work use an accessible synthetic-demo sheet', () => {
  assert.match(html, /id="experience-overlay"[^>]*hidden/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(js, /Synthetic demo only\. No external system will be changed\./);
  assert.match(css, /\.experience-overlay/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('mobile create control keeps an accessible name when its text is hidden', () => {
  assert.match(html, /id="create-button"[^>]*aria-label="Create"/);
});

test('AI Assistant is a governed question-and-answer workspace', () => {
  assert.match(js, /What would you like to <span>understand\?<\/span>/);
  assert.match(js, /Ask a question about Bursa, markets, policy, or approved knowledge/);
  assert.match(js, /function assistantAnswer\(/);
  assert.doesNotMatch(js, /Delegate as mission<\/button>/);
});

test('Decision Canvas exposes plot, analysis, source, and action views', () => {
  assert.match(js, /var tabs = \["plot", "analysis", "source", "action"\]/);
  assert.match(js, /data-assistant-canvas-tab/);
  assert.match(js, /data-canvas-action="memory"/);
  assert.match(js, /data-canvas-action="email"/);
  assert.match(js, /role="tablist" aria-label="Decision Canvas views"/);
  assert.match(css, /\.decision-canvas/);
  assert.match(css, /\.assistant-chart/);
});

test('sidebar reflects the focused navigation model', () => {
  assert.match(html, /data-page="assistant"[\s\S]*data-page="ask-bursa"/);
  assert.match(html, /data-page="exchange"[\s\S]*data-page="action"[\s\S]*data-page="verification"/);
  assert.match(html, /data-page="connectors"[\s\S]*class="sidebar-footer"[\s\S]*data-page="settings"/);
  assert.doesNotMatch(html, /data-page="automation"/);
  assert.doesNotMatch(html, /data-page="rooms"/);
  assert.doesNotMatch(html, /data-page="workspace"/);
  assert.doesNotMatch(html, /data-page="brief"/);
});

test('Ask Bursa is internal question-and-answer without a Decision Canvas', () => {
  assert.match(js, /function askBursaPage\(/);
  assert.match(js, /HR, Group Technology, Regulations, or Market Operations/);
  assert.match(js, /Q&amp;A only/);
  assert.match(js, /function submitAskBursa\(/);
  assert.doesNotMatch(js, /class="bursa-scope"/);
  assert.doesNotMatch(css, /\.bursa-scope/);
  for (const source of [js, designDocs, designLibrary]) {
    assert.doesNotMatch(source, /Your role and permissions are applied/);
    assert.doesNotMatch(source, /Ask Bursa Permission Scope/);
  }
});

test('Action workspace manages decision memory and email schedules', () => {
  assert.match(js, /function actionPage\(/);
  assert.match(js, /function assistantAnswerKey\(/);
  assert.match(js, /Saved to Decision Memory/);
  assert.match(js, /Automate by Email/);
  assert.match(js, /data-email-toggle/);
});

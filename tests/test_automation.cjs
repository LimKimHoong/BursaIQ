const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({ window: {}, Date, Intl, URL, FormData });
const js = path.join(__dirname, '..', 'static', 'js');
for (const name of ['demo-data.js', 'engine.js', 'automation.js']) vm.runInContext(fs.readFileSync(path.join(js, name), 'utf8'), context);
const model = context.window.BursaIQAutomation;
const valid = (extra = {}) => model.draft({ recipients: 'analyst@example.test', ...extra });
const storage = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };

test('email addresses are validated, normalized and deduplicated', () => {
  assert.equal(model.recipients('A@example.test; a@example.test\nb@example.test').join(','), 'a@example.test,b@example.test');
  assert.equal(Object.keys(model.validate(valid())).length, 0);
  assert.ok(model.validate(valid({ recipients: 'invalid' })).recipients);
  assert.ok(model.validate(valid({ recipients: Array.from({length: 11}, (_, n) => `u${n}@example.test`).join(',') })).recipients);
});
test('validation covers missing subjects, days, time and instruction limits', () => {
  assert.ok(model.validate(valid({ title: '', frequency: 'weekly', days: [], time: '24:01', instructions: 'x'.repeat(1201) })).title);
  assert.ok(model.validate(valid({ frequency: 'weekly', days: [] })).days);
  assert.ok(model.validate(valid({ time: '24:01' })).time);
  assert.ok(model.validate(valid({ timezone: 'unknown' })).timezone);
});
test('daily next run observes Malaysia time and midnight rollover', () => {
  assert.equal(model.nextRun(valid(), new Date('2026-10-11T00:00:00Z')).toISOString(), '2026-10-11T00:30:00.000Z');
  assert.equal(model.nextRun(valid(), new Date('2026-10-11T00:30:00Z')).toISOString(), '2026-10-12T00:30:00.000Z');
  assert.equal(model.nextRun(valid({ time: '00:15' }), new Date('2026-10-11T15:59:00Z')).toISOString(), '2026-10-11T16:15:00.000Z');
});
test('selected weekdays, UTC and paused schedules calculate correctly', () => {
  assert.equal(model.nextRun(valid({ frequency: 'weekly', days: [1, 3, 5] }), new Date('2026-10-11T01:00:00Z')).toISOString(), '2026-10-12T00:30:00.000Z');
  assert.equal(model.nextRun(valid({ timezone: 'UTC' }), new Date('2026-10-11T01:00:00Z')).toISOString(), '2026-10-11T08:30:00.000Z');
  assert.equal(model.nextRun(valid({ enabled: false })), null);
});
test('saving and editing are persistent, identity scoped and do not duplicate rows', () => {
  const local = storage();
  const saved = model.save(local, 'gcmc', valid()).item;
  assert.equal(model.load(local, 'gcmc').length, 1);
  assert.equal(model.load(local, 'hr').length, 0);
  model.save(local, 'gcmc', { ...saved, enabled: false, title: 'Updated subject' });
  assert.equal(model.load(local, 'gcmc').length, 1);
  assert.equal(model.load(local, 'gcmc')[0].enabled, false);
  assert.equal(model.load(local, 'gcmc')[0].title, 'Updated subject');
  model.save(local, 'hr', valid());
  assert.equal(model.load(local, 'gcmc').length, 1);
});
test('corrupt storage and quota failures are handled without false success', () => {
  assert.equal(model.load({ getItem: () => '{invalid' }, 'gcmc').length, 0);
  assert.match(model.save({ getItem: () => null, setItem: () => { throw Error('quota'); } }, 'gcmc', valid()).error, /could not save/);
});
test('email preview includes requested sections and honestly labels the demo boundary', () => {
  const input = valid({ instructions: '<script>alert(1)</script>', includes: { link: true, dashboard: true, report: true } });
  const result = context.window.BursaIQEngine.respond('market', input.question);
  const html = model.preview(input, { answer: result, asOf: '31 Jul 2026', generatedAt: '11 Oct 2026', url: 'https://example.test/' });
  assert.match(html, /Dashboard snapshot/);
  assert.match(html, /Report summary/);
  assert.match(html, /GCMC Market Pulse/);
  assert.match(html, /31 Jul 2026/);
  assert.match(html, /not sent/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /\[object Object\]/);
});
test('preview refresh re-reads the data rather than reusing the original answer', () => {
  const market = context.window.BURSAIQ_DEMO.market.headline;
  const original = market.fbmKLCI;
  market.fbmKLCI = 1700;
  const html = model.preview(valid(), { answer: context.window.BursaIQEngine.respond('market', valid().question), asOf: '31 Jul 2026', generatedAt: 'now', url: 'https://example.test/' });
  assert.match(html, /1,700.0/);
  market.fbmKLCI = original;
});

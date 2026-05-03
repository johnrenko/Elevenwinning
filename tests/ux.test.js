const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('draft UI is mobile-first and slot based instead of a long native select grid', () => {
  assert.match(html, /class="[^"]*score-header/);
  assert.match(html, /id="draftBoard"/);
  assert.match(html, /id="playerPicker"[^>]*hidden/);
  assert.doesNotMatch(html, /<select/i, 'drafting should not rely on native select grids');
  assert.doesNotMatch(html, /team-grid/, 'old select grid should be removed');
  assert.match(js, /buildFormationSlots/);
  assert.match(js, /openPlayerPicker/);
  assert.match(js, /searchPlayers\(\{ query: state\.query, position: 'ALL'/, 'picker should show every role for every slot');
});

test('one-handed controls, fixed touch targets, and overflow protections are present', () => {
  assert.match(css, /\.bottom-action-bar[\s\S]*position:\s*(sticky|fixed)/);
  assert.match(css, /\.slot-button[\s\S]*min-height:\s*(5|6|7|8)\dpx/);
  assert.match(css, /\[hidden\][\s\S]*display:\s*none\s*!important/);
  assert.match(css, /overflow-wrap:\s*anywhere|text-overflow:\s*ellipsis/);
  assert.match(css, /@media\s*\([^)]*max-width:\s*430px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('result surface includes fun simulation timeline and explainable stat-backed output', () => {
  assert.match(html, /id="matchTimeline"/);
  assert.match(html, /id="decidingFactors"/);
  assert.match(html, /id="bestPlayer"/);
  assert.match(html, /id="weakLink"/);
  assert.match(html, /id="whyResult"/);
  assert.match(html, /id="rematch"/);
  assert.match(js, /renderTimeline/);
  assert.match(js, /momentum/i);
});

test('offline-first normal path does not call a football API during draft or simulation', () => {
  assert.doesNotMatch(js, /fetch\(/, 'normal draft and simulation path must use local seed data');
  assert.doesNotMatch(js, /api-football|sportmonks/i, 'provider calls belong behind future server routes, not browser JS');
});

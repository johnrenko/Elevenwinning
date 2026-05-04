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
  assert.match(html, /id="liveClock"/);
  assert.match(html, /id="liveScoreA"/);
  assert.match(html, /id="liveScoreB"/);
  assert.match(html, /id="liveStatus"/);
  assert.match(html, /id="headerScoreline"/);
  assert.match(html, /id="headerEvent"/);
  assert.match(html, /id="momentumA"/);
  assert.match(html, /id="xgStat"/);
  assert.match(html, /id="cardsStat"/);
  assert.match(html, /id="pauseReplay"/);
  assert.match(html, /id="nextHighlight"/);
  assert.match(html, /id="instantResult"/);
  assert.match(html, /class="match-tabs"/);
  assert.match(html, /id="tacticalReport"/);
  assert.match(html, /id="matchTimeline"/);
  assert.match(html, /id="decidingFactors"/);
  assert.match(html, /id="bestPlayer"/);
  assert.match(html, /id="weakLink"/);
  assert.match(html, /id="whyResult"/);
  assert.match(html, /id="rematch"/);
  assert.match(html, /id="quickLive"/);
  assert.match(js, /renderTimeline/);
  assert.match(js, /startLiveReplay/);
  assert.match(js, /setInterval/);
  assert.match(js, /revealedFrames/);
  assert.match(js, /updateLiveCard/);
  assert.match(js, /scrollIntoView/);
  assert.match(js, /toggleReplayPause/);
  assert.match(js, /skipToNextHighlight/);
  assert.match(js, /showInstantResult/);
  assert.match(js, /scoreAfter/);
  assert.match(js, /scorer/);
  assert.match(js, /matchState/);
  assert.match(js, /shouldConvertChance/);
  assert.match(js, /finalScoreForTimeline/);
  assert.doesNotMatch(js, /goalPlan|plannedGoals|family\s*=\s*index|scoreBandFor/, 'score should emerge from generated chances instead of a planned final score skeleton');
  assert.match(js, /timeline-trigger/);
  assert.match(js, /aria-expanded/);
  assert.match(css, /\.live-card/);
  assert.match(css, /\.live-scoreboard/);
  assert.match(css, /\.momentum-bars/);
  assert.match(css, /\.replay-controls/);
  assert.match(css, /\.match-tabs/);
  assert.match(css, /\.event-marker/);
  assert.match(css, /\.tactical-report/);
  assert.match(css, /\.timeline-detail/);
  assert.match(css, /\.timeline-meter/);
  assert.match(js, /momentum/i);
});

test('live match centre tabs and replay controls behave like real sections', () => {
  assert.match(js, /matchTimeline\.hidden\s*=\s*state\.activeTab !== 'highlights'/);
  assert.match(js, /tacticalReport'\)\.hidden\s*=\s*state\.activeTab !== 'resume'/);
  assert.match(js, /updateReplayControls/);
  assert.match(js, /nextButton\.disabled\s*=\s*!hasNext \|\| finished/);
  assert.match(js, /finalButton\.textContent\s*=\s*finished \? 'Termine' : 'Resultat final'/);
  assert.match(js, /eventMarkerText/);
  assert.match(js, /marker-\$\{escapeHtml\(event\.type\)\}[^>]*>\$\{eventMarkerText\(event\.type\)\}/);
  assert.match(css, /\.replay-controls button:disabled/);
  assert.match(css, /\.replay-controls button\.is-active/);
  assert.match(css, /#headerTitle|h1[\s\S]*text-overflow:\s*ellipsis/);
});

test('offline-first normal path does not call a football API during draft or simulation', () => {
  assert.doesNotMatch(js, /fetch\(/, 'normal draft and simulation path must use local seed data');
  assert.doesNotMatch(js, /api-football|sportmonks/i, 'provider calls belong behind future server routes, not browser JS');
});

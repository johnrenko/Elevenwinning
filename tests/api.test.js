const test = require('node:test');
const assert = require('node:assert/strict');

const search = require('../api/search.js');
const player = require('../api/player/[id].js');
const sync = require('../api/sync/api-football.js');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('search API returns normalized verified roster results with cache headers and no provider key', () => {
  const res = mockRes();
  search({ query: { q: 'mbap', position: 'FWD', league: 'La Liga' } }, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Cache-Control'], /s-maxage=86400/);
  assert.equal(res.body.source, 'verified-rosters');
  assert.ok(res.body.players.some((candidate) => candidate.id === 'roster-real-madrid-kylian-mbappe'));
  assert.equal(JSON.stringify(res.body).includes('API_KEY'), false);
  assert.equal(JSON.stringify(res.body).includes('api-football'), false);
});

test('player API returns one normalized profile and a 404 for unknown ids', () => {
  const found = mockRes();
  player({ query: { id: 'roster-psg-vitinha' } }, found);
  assert.equal(found.statusCode, 200);
  assert.equal(found.body.source, 'verified-rosters');
  assert.equal(found.body.player.name, 'Vitinha');
  assert.ok(found.body.player.per90);

  const missing = mockRes();
  player({ query: { id: 'unknown' } }, missing);
  assert.equal(missing.statusCode, 404);
});

test('manual sync route is admin-only and never part of normal drafting', () => {
  const unauthorized = mockRes();
  sync({ headers: {} }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);
  assert.equal(unauthorized.headers['Cache-Control'], 'no-store');
});

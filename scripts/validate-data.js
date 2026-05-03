const assert = require('node:assert/strict');
const { players, formations, buildFormationSlots } = require('../app.js');

const required = [
  'id',
  'name',
  'team',
  'league',
  'position',
  'role',
  'age',
  'nationality',
  'imageUrl',
  'minutes',
  'appearances',
  'goals',
  'assists',
  'cards',
  'cleanSheets',
  'saves',
  'goalsConceded',
  'shots',
  'passes',
  'tackles',
  'rating',
  'freshness'
];

const topFive = new Set(['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1']);
const ids = new Set();
const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

assert.ok(players.length >= 160, `Expected at least 160 players, received ${players.length}`);

for (const player of players) {
  for (const field of required) assert.ok(Object.hasOwn(player, field), `${player.id || player.name} missing ${field}`);
  assert.equal(ids.has(player.id), false, `Duplicate player id: ${player.id}`);
  assert.ok(topFive.has(player.league), `${player.name} has unsupported league ${player.league}`);
  assert.ok(counts[player.position] !== undefined, `${player.name} has unsupported position ${player.position}`);
  assert.ok(player.minutes >= 0, `${player.name} has negative minutes`);
  assert.ok(player.rating >= 0 && player.rating <= 10, `${player.name} rating must be 0-10`);
  ids.add(player.id);
  counts[player.position] += 1;
}

for (const position of ['GK', 'DEF', 'MID', 'FWD']) {
  assert.ok(counts[position] >= 40, `Expected at least 40 ${position}, received ${counts[position]}`);
}

for (const formation of Object.keys(formations)) {
  const slots = buildFormationSlots(formation);
  assert.equal(slots.length, 11, `${formation} must create exactly 11 slots`);
  assert.equal(slots.filter((slot) => slot.position === 'GK').length, 1, `${formation} must have one GK`);
}

console.log(`Data validation passed: ${players.length} players across ${[...topFive].join(', ')}.`);

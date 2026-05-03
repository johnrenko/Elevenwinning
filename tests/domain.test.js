const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../app.js');
const requestedClubRosters = require('../data/requested-club-roster-supplement.js');

const topFiveLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
const requiredPlayerFields = [
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

function makeTeam(ids, formation = '4-3-3') {
  return {
    formation,
    picks: ids.map((playerId, slotIndex) => ({ playerId, slotIndex }))
  };
}

function validIdsFor433(offset = 0) {
  const ids = [
    ...app.players.filter((player) => player.position === 'GK').slice(offset, offset + 1).map((player) => player.id),
    ...app.players.filter((player) => player.position === 'DEF').slice(offset * 4, offset * 4 + 4).map((player) => player.id),
    ...app.players.filter((player) => player.position === 'MID').slice(offset * 3, offset * 3 + 3).map((player) => player.id),
    ...app.players.filter((player) => player.position === 'FWD').slice(offset * 3, offset * 3 + 3).map((player) => player.id)
  ];
  assert.equal(ids.length, 11, 'seed data must contain enough players for a 4-3-3 team');
  return ids;
}

function offRoleForwardTeam() {
  const forwards = app.players.filter((player) => player.position === 'FWD').slice(0, 11);
  const slots = app.buildFormationSlots('4-3-3');
  assert.equal(forwards.length, 11, 'seed data must contain enough forwards for off-role drafting');
  return {
    formation: '4-3-3',
    picks: forwards.map((player, slotIndex) => ({
      slotId: slots[slotIndex].id,
      slotIndex,
      playerId: player.id
    }))
  };
}

test('exports the domain helpers used by tests and the browser', () => {
  for (const key of [
    'players',
    'formations',
    'normalizePlayer',
    'validateTeam',
    'calculateTeamStrength',
    'simulateMatch',
    'searchPlayers',
    'buildFormationSlots'
  ]) {
    assert.ok(app[key], `missing export: ${key}`);
  }
});

test('extended player database covers the top five leagues with normalized season fields', () => {
  assert.ok(app.players.length >= 160, 'expected at least 160 seed players for an extended draft database');
  assert.deepEqual(new Set(topFiveLeagues).difference(new Set(app.players.map((player) => player.league))), new Set());

  const ids = new Set();
  const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const player of app.players) {
    for (const field of requiredPlayerFields) {
      assert.ok(Object.hasOwn(player, field), `${player.name || 'unknown'} missing ${field}`);
    }
    assert.match(player.id, /^[a-z0-9-]+$/);
    assert.equal(ids.has(player.id), false, `duplicate player id ${player.id}`);
    ids.add(player.id);
    assert.ok(topFiveLeagues.includes(player.league), `${player.name} league should be Top 5`);
    assert.ok(positionCounts[player.position] !== undefined, `${player.name} position should map to a formation group`);
    positionCounts[player.position] += 1;
    assert.equal(typeof player.freshness.season, 'string');
    assert.ok(player.freshness.confidence >= 0 && player.freshness.confidence <= 1);
  }

  for (const position of ['GK', 'DEF', 'MID', 'FWD']) {
    assert.ok(positionCounts[position] >= 40, `needs at least 40 ${position} players`);
  }
});

test('verified roster supplement is the full player database and covers every audited club', () => {
  const expectedClubCounts = {
    PSG: 28,
    'Bayern Munich': 32,
    'Real Madrid': 41,
    Barcelona: 36,
    'Manchester City': 26,
    Arsenal: 51,
    'Manchester United': 34,
    Chelsea: 55,
    Juventus: 29,
    Inter: 25,
    'AC Milan': 49,
    Napoli: 39,
    Liverpool: 30
  };

  const counts = {};
  for (const row of requestedClubRosters) {
    counts[row[2]] = (counts[row[2]] || 0) + 1;
    assert.match(row[0], /^roster-[a-z0-9-]+$/);
    assert.ok(['uefa-ucl-squad', 'uefa-domestic-squad', 'premier-league-squad-list'].includes(row[20].provider));
    assert.equal(row[20].season, '2025-26');
  }

  assert.deepEqual(counts, expectedClubCounts);
  assert.equal(app.players.length, requestedClubRosters.length);

  for (const [team, expectedCount] of Object.entries(expectedClubCounts)) {
    const normalized = app.players.filter((player) => player.id.startsWith(`roster-`) && player.team === team);
    assert.equal(normalized.length, expectedCount, `${team} roster rows should be normalized into app.players`);
    assert.ok(normalized.some((player) => player.position === 'GK'), `${team} needs goalkeepers`);
    assert.ok(normalized.some((player) => player.position === 'DEF'), `${team} needs defenders`);
    assert.ok(normalized.some((player) => player.position === 'MID'), `${team} needs midfielders`);
    assert.ok(normalized.some((player) => player.position === 'FWD'), `${team} needs forwards`);
  }

  assert.ok(app.searchPlayers({ query: 'salah', position: 'FWD', league: 'Premier League' }).some((player) => player.name === 'Mohamed Salah' && player.team === 'Liverpool'));
  assert.ok(app.searchPlayers({ query: 'de bruyne', position: 'MID', league: 'Serie A' }).some((player) => player.name === 'Kevin De Bruyne' && player.team === 'Napoli'));
  assert.equal(app.players.some((player) => player.name === 'Kevin De Bruyne' && player.team === 'Manchester City'), false);
  assert.equal(app.players.some((player) => player.name === 'Warren Zaire-Emery' && player.team === 'AC Milan'), false);
  assert.equal(app.players.some((player) => player.freshness.provider === 'openfootball-scrape' || player.freshness.provider === 'curated-local'), false);

  const clubsByName = new Map();
  for (const player of app.players) {
    const key = player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!clubsByName.has(key)) clubsByName.set(key, new Set());
    clubsByName.get(key).add(player.team);
  }
  const duplicateAssignments = [...clubsByName.entries()].filter(([, clubs]) => clubs.size > 1);
  assert.deepEqual(duplicateAssignments, []);
});

test('team validation allows any player in any slot while enforcing XI size and duplicates', () => {
  const validTeam = makeTeam(validIdsFor433());
  assert.equal(app.validateTeam(validTeam).valid, true);

  assert.match(app.validateTeam(makeTeam(validIdsFor433().slice(0, 10))).errors.join(' '), /11 joueurs/);
  assert.match(app.validateTeam(makeTeam([...validIdsFor433().slice(0, 10), validIdsFor433()[1]])).errors.join(' '), /doublon/);

  const forwardsEverywhere = offRoleForwardTeam();
  assert.equal(app.validateTeam(forwardsEverywhere).valid, true);
  assert.equal(app.validateTeam(forwardsEverywhere).counts.FWD, 11);

  const strength = app.calculateTeamStrength(forwardsEverywhere);
  assert.equal(strength.valid, true);
  assert.ok(strength.areas.keeper > 0, 'a forward in the GK slot should still occupy the keeper role');
  assert.ok(strength.areas.defense > 0, 'forwards in DEF slots should still occupy defensive roles');
});

test('stat normalization is deterministic and protects against missing values and zero minutes', () => {
  const normalized = app.normalizePlayer({
    id: 'test-player',
    name: 'Test Player',
    position: 'FWD',
    minutes: 0,
    goals: undefined,
    assists: null,
    shots: 3,
    rating: 7
  });

  assert.equal(normalized.goals, 0);
  assert.equal(normalized.assists, 0);
  assert.equal(normalized.per90.goals, 0);
  assert.equal(normalized.per90.shots, 0);
  assert.equal(normalized.position, 'FWD');
});

test('simulation is bounded, stat-backed, explainable, and fun to replay', () => {
  const strongTeam = makeTeam(validIdsFor433(0));
  const weakerTeam = makeTeam(validIdsFor433(1));
  const result = app.simulateMatch(strongTeam, weakerTeam);

  assert.ok(result.probabilities.A > result.probabilities.B, 'stronger team should receive higher probability');
  assert.ok(result.probabilities.A >= 0.05 && result.probabilities.A <= 0.95);
  assert.ok(result.probabilities.B >= 0.05 && result.probabilities.B <= 0.95);
  assert.equal(result.decidingFactors.length, 3);
  assert.ok(result.bestPlayer.name);
  assert.ok(result.weakLink.name);
  assert.match(result.why, /parce que|grâce|malgré|pression|contrôle/i);
  assert.ok(result.scoreBand.includes('-'), 'expected score band copy such as 2-1');

  assert.ok(result.timeline.length >= 8, 'timeline needs enough moments to feel arcade-like');
  assert.ok(result.timeline.length <= 12, 'timeline should stay short enough for a 10-15 second replay');
  assert.ok(result.timeline.some((event) => ['momentum', 'chance', 'goal', 'save'].includes(event.type)));
  for (const event of result.timeline) {
    assert.ok(event.minute >= 1 && event.minute <= 90);
    assert.ok(['A', 'B', 'neutral'].includes(event.team));
    assert.ok(event.text.length > 12);
    assert.ok(Math.abs(event.impact) <= 12, 'timeline randomness should not dominate the stat model');
  }

  const chemistryHeavy = app.calculateTeamStrength(strongTeam, { ignoreChemistry: false });
  const rawOnly = app.calculateTeamStrength(strongTeam, { ignoreChemistry: true });
  assert.ok(Math.abs(chemistryHeavy.total - rawOnly.total) <= 8, 'chemistry and formation caps cannot dominate raw stats');
});

test('local search supports instant drafting filters without runtime API calls', () => {
  const results = app.searchPlayers({ query: 'mbap', position: 'FWD', league: 'La Liga' });
  assert.ok(results.length >= 1);
  assert.equal(results[0].position, 'FWD');
  assert.equal(results[0].league, 'La Liga');

  const accents = app.searchPlayers({ query: 'vitinha', position: 'MID' });
  assert.ok(accents.some((player) => player.name.includes('Vitinha')));
});

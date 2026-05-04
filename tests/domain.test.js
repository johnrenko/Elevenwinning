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
    'simulationModel',
    'normalizePlayer',
    'validateTeam',
    'calculateTeamStrength',
    'simulateMatch',
    'searchPlayers',
    'buildFormationSlots',
    'buildLiveFrames'
  ]) {
    assert.ok(app[key], `missing export: ${key}`);
  }
});

test('slot-index fallback applies the same role model as explicit slot ids', () => {
  const ids = validIdsFor433();
  const slots = app.buildFormationSlots('4-3-3');
  const withSlotIndex = makeTeam(ids);
  const withSlotId = {
    formation: '4-3-3',
    picks: ids.map((playerId, slotIndex) => ({ playerId, slotIndex, slotId: slots[slotIndex].id }))
  };

  const indexed = app.calculateTeamStrength(withSlotIndex);
  const explicit = app.calculateTeamStrength(withSlotId);

  assert.equal(indexed.total, explicit.total);
  assert.deepEqual(indexed.areas, explicit.areas);
  assert.equal(indexed.roleFit, explicit.roleFit);
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

test('forward in the goalkeeper slot is a severe tactical handicap', () => {
  const balanced = makeTeam(validIdsFor433());
  const balancedStrength = app.calculateTeamStrength(balanced);
  const replacementForward = app.players.find((player) => player.position === 'FWD' && !balanced.picks.some((pick) => pick.playerId === player.id));
  const noKeeper = {
    formation: '4-3-3',
    picks: balanced.picks.map((pick, index) => index === 0 ? { ...pick, playerId: replacementForward.id } : pick)
  };

  const noKeeperStrength = app.calculateTeamStrength(noKeeper);
  const result = app.simulateMatch(balanced, noKeeper, { seed: 'forward-gk' });

  assert.equal(noKeeperStrength.valid, true);
  assert.ok(noKeeperStrength.total <= balancedStrength.total - 12, 'a forward in goal must materially reduce team strength');
  assert.ok(noKeeperStrength.risk >= app.simulationModel.crisisPenalties.noNaturalKeeper);
  assert.ok(noKeeperStrength.mismatches.some((mismatch) => mismatch.nativePosition === 'FWD' && mismatch.assignedPosition === 'GK'));
  assert.ok(noKeeperStrength.explainers.join(' ').includes('gardien'));
  assert.ok(result.probabilities.A >= 0.75, 'a balanced XI should become a heavy favorite against a forward goalkeeper');
  assert.equal(result.winner, 'A');
});

test('adjacent off-role picks are penalized without becoming a full crisis', () => {
  const balanced = makeTeam(validIdsFor433());
  const replacementMidfielder = app.players.find((player) => player.position === 'MID' && !balanced.picks.some((pick) => pick.playerId === player.id));
  const midfielderAtDefender = {
    formation: '4-3-3',
    picks: balanced.picks.map((pick, index) => index === 1 ? { ...pick, playerId: replacementMidfielder.id } : pick)
  };

  const balancedStrength = app.calculateTeamStrength(balanced);
  const offRoleStrength = app.calculateTeamStrength(midfielderAtDefender);

  assert.ok(offRoleStrength.total < balancedStrength.total);
  assert.ok(balancedStrength.total - offRoleStrength.total < 10, 'one MID-to-DEF swap should hurt but not destroy the XI');
  assert.equal(offRoleStrength.crisis.some((item) => item.type === 'noNaturalDefenders'), false);
  assert.ok(offRoleStrength.mismatches.some((mismatch) => mismatch.nativePosition === 'MID' && mismatch.assignedPosition === 'DEF'));
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
  const candidateA = makeTeam(validIdsFor433(0));
  const candidateB = makeTeam(validIdsFor433(1));
  const candidateAStrength = app.calculateTeamStrength(candidateA);
  const candidateBStrength = app.calculateTeamStrength(candidateB);
  const strongTeam = candidateAStrength.total >= candidateBStrength.total ? candidateA : candidateB;
  const weakerTeam = candidateAStrength.total >= candidateBStrength.total ? candidateB : candidateA;
  const result = app.simulateMatch(strongTeam, weakerTeam);

  assert.ok(result.probabilities.A > result.probabilities.B, 'stronger team should receive higher probability');
  assert.ok(result.probabilities.A >= 0.05 && result.probabilities.A <= 0.95);
  assert.ok(result.probabilities.B >= 0.05 && result.probabilities.B <= 0.95);
  assert.equal(result.decidingFactors.length, 3);
  assert.ok(result.bestPlayer.name);
  assert.ok(result.weakLink.name);
  assert.match(result.why, /parce que|grâce|malgré|pression|contrôle/i);
  assert.ok(result.scoreBand.includes('-'), 'expected score band copy such as 2-1');
  assert.equal(result.liveFrames.length, result.timeline.length);
  assert.ok(result.tacticalReport.length >= 8);

  assert.ok(result.timeline.length >= 8, 'timeline needs enough moments to feel arcade-like');
  assert.ok(result.timeline.length <= 12, 'timeline should stay short enough for a 10-15 second replay');
  assert.ok(result.timeline.some((event) => ['momentum', 'chance', 'goal', 'save'].includes(event.type)));
  assert.ok(new Set(result.timeline.map((event) => event.type)).size >= 5, 'timeline should mix different event families');
  for (const event of result.timeline) {
    assert.ok(event.minute >= 1 && event.minute <= 90);
    assert.ok(['A', 'B', 'neutral'].includes(event.team));
    assert.ok(event.text.length > 12);
    assert.ok(event.label.length >= 3);
    assert.ok(event.phase.length >= 5);
    assert.ok(event.detail.length > 12);
    assert.ok(event.intensity >= 18 && event.intensity <= 100);
    assert.match(event.scoreAfter, /^\d-\d$/);
    assert.ok(event.matchState, 'events should expose match-state cause and effect');
    assert.ok(Math.abs(event.impact) <= 12, 'timeline randomness should not dominate the stat model');
  }

  const goals = result.timeline.filter((event) => event.type === 'goal');
  assert.ok(goals.length >= 1, 'live replay needs at least one score-changing goal event');
  for (const goal of goals) {
    assert.equal(goal.isScoreChange, true);
    assert.ok(goal.scorer && goal.scorer.length > 2);
    assert.doesNotMatch(goal.text, /gardien ferme|sauvetage|arret/i, 'goal copy must not reuse save or blocked-shot language');
    assert.match(goal.scoreAfter, /^\d-\d$/);
  }
  const finalFrame = result.liveFrames.at(-1);
  assert.equal(`${finalFrame.scoreA}-${finalFrame.scoreB}`, result.scoreBand);
  assert.equal(finalFrame.status, 'FT');
  assert.ok(result.liveFrames.some((frame, index, frames) => index > 0 && `${frame.scoreA}-${frame.scoreB}` !== `${frames[index - 1].scoreA}-${frames[index - 1].scoreB}`), 'scoreboard should mutate during goal frames');
  assert.ok(result.liveFrames.every((frame, index, frames) => index === 0 || frame.minute >= frames[index - 1].minute), 'live clock frames should move forward');
  for (let index = 1; index < result.liveFrames.length; index += 1) {
    const frame = result.liveFrames[index];
    if (frame.event.type !== 'goal') continue;
    const previous = result.liveFrames[index - 1];
    if (frame.event.team === 'A') assert.ok(frame.momentumA >= previous.momentumA, 'A momentum should rise or cap after an A goal');
    if (frame.event.team === 'B') assert.ok(frame.momentumB >= previous.momentumB, 'B momentum should rise or cap after a B goal');
    assert.ok(frame.stats.xgA >= 0 && frame.stats.xgB >= 0);
  }

  const chemistryHeavy = app.calculateTeamStrength(strongTeam, { ignoreChemistry: false });
  const rawOnly = app.calculateTeamStrength(strongTeam, { ignoreChemistry: true });
  assert.ok(Math.abs(chemistryHeavy.total - rawOnly.total) <= 8, 'chemistry and formation caps cannot dominate raw stats');
});

test('seeded close-game variance can create upsets but not severe mismatch wins', () => {
  const closeTeam = makeTeam(validIdsFor433());
  const closeWinners = new Set();
  for (let seed = 1; seed <= 30; seed += 1) {
    closeWinners.add(app.simulateMatch(closeTeam, closeTeam, { seed }).winner);
  }
  assert.deepEqual(closeWinners, new Set(['A', 'B']));

  const replacementForward = app.players.find((player) => player.position === 'FWD' && !closeTeam.picks.some((pick) => pick.playerId === player.id));
  const noKeeper = {
    formation: '4-3-3',
    picks: closeTeam.picks.map((pick, index) => index === 0 ? { ...pick, playerId: replacementForward.id } : pick)
  };
  for (let seed = 1; seed <= 20; seed += 1) {
    assert.equal(app.simulateMatch(closeTeam, noKeeper, { seed }).winner, 'A');
  }
});

test('timeline replay seed changes narration without changing the seeded result', () => {
  const closeTeam = makeTeam(validIdsFor433());
  const firstReplay = app.simulateMatch(closeTeam, closeTeam, { seed: 'same-outcome', timelineSeed: 'timeline-one' });
  const secondReplay = app.simulateMatch(closeTeam, closeTeam, { seed: 'same-outcome', timelineSeed: 'timeline-two' });

  assert.equal(firstReplay.winner, secondReplay.winner);
  assert.equal(firstReplay.scoreBand, secondReplay.scoreBand);
  assert.deepEqual(firstReplay.probabilities, secondReplay.probabilities);
  assert.notDeepEqual(
    firstReplay.timeline.map((event) => `${event.type}:${event.text}`),
    secondReplay.timeline.map((event) => `${event.type}:${event.text}`),
    'replays should diversify the timeline while keeping the stat-backed result stable'
  );
});

test('local search supports instant drafting filters without runtime API calls', () => {
  const results = app.searchPlayers({ query: 'mbap', position: 'FWD', league: 'La Liga' });
  assert.ok(results.length >= 1);
  assert.equal(results[0].position, 'FWD');
  assert.equal(results[0].league, 'La Liga');

  const accents = app.searchPlayers({ query: 'vitinha', position: 'MID' });
  assert.ok(accents.some((player) => player.name.includes('Vitinha')));
});

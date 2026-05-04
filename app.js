(function elevenWinningModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ElevenWinning = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createElevenWinning() {
  const formations = {
    '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2, effect: { attack: 1.01, midfield: 1, defense: 1.01 } },
    '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3, effect: { attack: 1.05, midfield: 0.99, defense: 0.99 } },
    '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2, effect: { attack: 1, midfield: 1.05, defense: 0.98 } }
  };

  const simulationModel = {
    areaWeights: {
      attack: { rating: 5.2, goals90: 15, assists90: 9, shots90: 2.5, reliability: 7, freshness: 2, agePrime: 2 },
      midfield: { rating: 5.4, passes90: 0.42, assists90: 10, tackles90: 5, reliability: 7, freshness: 2, agePrime: 2 },
      defense: { rating: 5.5, tackles90: 7, cleanSheets90: 18, cards90: -10, goalsConceded90: -9, reliability: 7, freshness: 2, agePrime: 1.5 },
      keeper: { rating: 4.5, saves90: 17, cleanSheets90: 15, goalsConceded90: -18, reliability: 6, freshness: 2, agePrime: 1 }
    },
    roleFit: {
      GK: { GK: 1, DEF: 0.16, MID: 0.12, FWD: 0.08 },
      DEF: { GK: 0.22, DEF: 1, MID: 0.68, FWD: 0.42 },
      MID: { GK: 0.18, DEF: 0.74, MID: 1, FWD: 0.72 },
      FWD: { GK: 0.12, DEF: 0.52, MID: 0.76, FWD: 1 }
    },
    mismatchLabels: {
      'FWD-GK': 'Attaquant dans les buts: enorme handicap.',
      'MID-GK': 'Milieu dans les buts: relance correcte, arrets tres fragiles.',
      'DEF-GK': 'Defenseur dans les buts: presence utile, reflexes limites.',
      'GK-FWD': 'Gardien hors de sa cage: contribution offensive quasi nulle.',
      'GK-MID': 'Gardien au milieu: tempo casse et appels rares.',
      'GK-DEF': 'Gardien en defense: placement prudent, duels compliques.',
      'MID-DEF': 'Milieu replace defenseur: relance correcte, duel fragile.',
      'DEF-MID': 'Defenseur au milieu: impact physique, creation limitee.',
      'FWD-DEF': 'Attaquant replace derriere: danger permanent dans son dos.',
      'DEF-FWD': 'Defenseur devant: presence aerienne, finition incertaine.',
      'FWD-MID': 'Attaquant au milieu: percussion utile, controle irregulier.',
      'MID-FWD': 'Milieu devant: jeu combine propre, instinct de but limite.'
    },
    crisisPenalties: {
      noNaturalKeeper: 14,
      noNaturalDefenders: 5,
      noNaturalMidfielders: 4,
      noNaturalForwards: 4,
      severeMismatch: 2.8
    },
    chemistryCap: 5,
    formationCap: 3,
    probabilityScale: 12,
    funVariance: {
      closeGameWindow: 7,
      maxUpsetShift: 0.16,
      heavyFavoriteFloor: 0.82
    }
  };
  const weights = simulationModel;

  function loadSupplement(path, browserGlobalName) {
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      try {
        return require(path);
      } catch (error) {
        return [];
      }
    }
    return typeof globalThis !== 'undefined' && Array.isArray(globalThis[browserGlobalName])
      ? globalThis[browserGlobalName]
      : [];
  }

  function loadRequestedClubRosters() {
    return loadSupplement('./data/requested-club-roster-supplement.js', 'ElevenWinningRequestedClubRosters');
  }

  function slugUrl(id) {
    return `https://images.elevenwinning.local/players/${id}.webp`;
  }

  function safeNumber(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function normalizePlayer(player) {
    const normalized = Array.isArray(player)
      ? {
          id: player[0],
          name: player[1],
          team: player[2],
          league: player[3],
          position: player[4],
          role: player[5],
          age: player[6],
          nationality: player[7],
          minutes: player[8],
          appearances: player[9],
          goals: player[10],
          assists: player[11],
          cards: player[12],
          cleanSheets: player[13],
          saves: player[14],
          goalsConceded: player[15],
          shots: player[16],
          passes: player[17],
          tackles: player[18],
          rating: player[19],
          freshness: player[20]
        }
      : { ...player };

    const minutes = safeNumber(normalized.minutes);
    const per90 = {};
    for (const key of ['goals', 'assists', 'shots', 'passes', 'tackles', 'saves']) {
      normalized[key] = safeNumber(normalized[key]);
      per90[key] = minutes > 0 ? Number(((normalized[key] * 90) / minutes).toFixed(2)) : 0;
    }

    return {
      id: normalized.id,
      name: normalized.name,
      team: normalized.team || 'Libre',
      league: normalized.league || 'Premier League',
      position: normalized.position || 'MID',
      role: normalized.role || 'Joueur complet',
      age: safeNumber(normalized.age, 25),
      nationality: normalized.nationality || 'Inconnue',
      imageUrl: normalized.imageUrl || slugUrl(normalized.id || 'unknown'),
      minutes,
      appearances: safeNumber(normalized.appearances),
      goals: safeNumber(normalized.goals),
      assists: safeNumber(normalized.assists),
      cards: safeNumber(normalized.cards),
      cleanSheets: safeNumber(normalized.cleanSheets),
      saves: safeNumber(normalized.saves),
      goalsConceded: safeNumber(normalized.goalsConceded),
      shots: safeNumber(normalized.shots),
      passes: safeNumber(normalized.passes),
      tackles: safeNumber(normalized.tackles),
      rating: safeNumber(normalized.rating, 7),
      freshness: normalized.freshness || { provider: 'curated-local', season: '2025-26', confidence: 0.82 },
      per90
    };
  }

  const players = loadRequestedClubRosters().map(normalizePlayer);
  const playerById = new Map(players.map((player) => [player.id, player]));

  function buildFormationSlots(formationName = '4-3-3') {
    const formation = formations[formationName] || formations['4-3-3'];
    const groups = ['GK', 'DEF', 'MID', 'FWD'];
    return groups.flatMap((position) => Array.from({ length: formation[position] }, (_, index) => ({
      id: `${position}-${index + 1}`,
      position,
      label: `${position} ${index + 1}`
    })));
  }

  function validateTeam(team) {
    const errors = [];
    const picks = Array.isArray(team && team.picks) ? team.picks : [];
    const ids = picks.map((pick) => pick.playerId).filter(Boolean);

    if (ids.length !== 11) errors.push('Il faut exactement 11 joueurs.');
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) errors.push('Un doublon est présent dans cette équipe.');

    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const id of ids) {
      const player = playerById.get(id);
      if (!player) {
        errors.push(`Joueur introuvable: ${id}`);
        continue;
      }
      counts[player.position] += 1;
    }

    return { valid: errors.length === 0, errors, counts };
  }

  function ratePer90(player, key) {
    return player.minutes > 0 ? (safeNumber(player[key]) * 90) / player.minutes : 0;
  }

  function reliabilityFor(player) {
    return Math.min(1, player.minutes / 2700) * 0.65 + Math.min(1, player.appearances / 30) * 0.35;
  }

  function agePrimeFor(player, assignedPosition) {
    const age = player.age;
    const prime = assignedPosition === 'GK' ? 30 : assignedPosition === 'DEF' ? 28 : 26;
    return clamp(1 - Math.abs(age - prime) / 12, 0, 1);
  }

  function roleFitFor(player, assignedPosition) {
    return simulationModel.roleFit[assignedPosition] && simulationModel.roleFit[assignedPosition][player.position] !== undefined
      ? simulationModel.roleFit[assignedPosition][player.position]
      : 0.45;
  }

  function mismatchTextFor(player, assignedPosition) {
    return simulationModel.mismatchLabels[`${player.position}-${assignedPosition}`] || `${player.role} replace en ${assignedPosition}: adaptation delicate.`;
  }

  function positionScore(player, assignedPosition = player.position) {
    const reliability = reliabilityFor(player);
    const freshness = player.freshness && Number.isFinite(Number(player.freshness.confidence)) ? Number(player.freshness.confidence) : 0.75;
    const agePrime = agePrimeFor(player, assignedPosition);
    const fit = roleFitFor(player, assignedPosition);
    const w = simulationModel.areaWeights;
    let raw;

    if (assignedPosition === 'GK') {
      raw = player.rating * w.keeper.rating
        + ratePer90(player, 'saves') * w.keeper.saves90
        + ratePer90(player, 'cleanSheets') * w.keeper.cleanSheets90
        + ratePer90(player, 'goalsConceded') * w.keeper.goalsConceded90
        + reliability * w.keeper.reliability
        + freshness * w.keeper.freshness
        + agePrime * w.keeper.agePrime;
      return Math.max(0.5, raw * fit);
    }

    if (assignedPosition === 'DEF') {
      raw = player.rating * w.defense.rating
        + ratePer90(player, 'tackles') * w.defense.tackles90
        + ratePer90(player, 'cleanSheets') * w.defense.cleanSheets90
        + ratePer90(player, 'cards') * w.defense.cards90
        + ratePer90(player, 'goalsConceded') * w.defense.goalsConceded90
        + reliability * w.defense.reliability
        + freshness * w.defense.freshness
        + agePrime * w.defense.agePrime;
      return Math.max(1, raw * fit);
    }

    if (assignedPosition === 'MID') {
      raw = player.rating * w.midfield.rating
        + ratePer90(player, 'passes') * w.midfield.passes90
        + ratePer90(player, 'assists') * w.midfield.assists90
        + ratePer90(player, 'tackles') * w.midfield.tackles90
        + reliability * w.midfield.reliability
        + freshness * w.midfield.freshness
        + agePrime * w.midfield.agePrime;
      return Math.max(1, raw * fit);
    }

    raw = player.rating * w.attack.rating
      + ratePer90(player, 'goals') * w.attack.goals90
      + ratePer90(player, 'assists') * w.attack.assists90
      + ratePer90(player, 'shots') * w.attack.shots90
      + reliability * w.attack.reliability
      + freshness * w.attack.freshness
      + agePrime * w.attack.agePrime;
    return Math.max(1, raw * fit);
  }

  function assignedPositionForPick(pick, player, team) {
    const slotId = pick && typeof pick.slotId === 'string' ? pick.slotId : '';
    const slotPosition = slotId.split('-')[0];
    if (formations['4-3-3'][slotPosition] !== undefined) return slotPosition;

    const slots = buildFormationSlots(team && team.formation);
    const slotIndex = Number.isInteger(pick && pick.slotIndex) ? pick.slotIndex : -1;
    return slots[slotIndex] ? slots[slotIndex].position : player.position;
  }

  function chemistryFor(teamPlayers) {
    const clubPairs = countPairs(teamPlayers.map((player) => player.team));
    const leaguePairs = countPairs(teamPlayers.map((player) => player.league));
    const nationPairs = countPairs(teamPlayers.map((player) => player.nationality));
    return Math.min(weights.chemistryCap, clubPairs * 0.22 + leaguePairs * 0.08 + nationPairs * 0.1);
  }

  function countPairs(values) {
    const counts = values.reduce((memo, value) => {
      memo[value] = (memo[value] || 0) + 1;
      return memo;
    }, {});
    return Object.values(counts).reduce((sum, count) => sum + (count * (count - 1)) / 2, 0);
  }

  function calculateTeamStrength(team, options = {}) {
    const validation = validateTeam(team);
    const picked = (team.picks || [])
      .map((pick) => ({ pick, player: playerById.get(pick.playerId) }))
      .filter((entry) => entry.player);
    const areas = { attack: 0, midfield: 0, defense: 0, keeper: 0 };
    const naturalSlotCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const mismatches = [];
    const enriched = [];

    for (const { pick, player } of picked) {
      const assignedPosition = assignedPositionForPick(pick, player, team);
      const fit = roleFitFor(player, assignedPosition);
      const score = positionScore(player, assignedPosition);
      if (assignedPosition === player.position) naturalSlotCounts[assignedPosition] += 1;
      if (assignedPosition !== player.position) {
        mismatches.push({
          player,
          assignedPosition,
          nativePosition: player.position,
          fit: Number(fit.toFixed(2)),
          severity: Number((1 - fit).toFixed(2)),
          text: mismatchTextFor(player, assignedPosition)
        });
      }
      if (assignedPosition === 'FWD') areas.attack += score;
      if (assignedPosition === 'MID') areas.midfield += score;
      if (assignedPosition === 'DEF') areas.defense += score;
      if (assignedPosition === 'GK') areas.keeper += score;
      enriched.push({ pick, player, assignedPosition, fit, score });
    }

    const formation = formations[team.formation] || formations['4-3-3'];
    const base = areas.attack * formation.effect.attack + areas.midfield * formation.effect.midfield + areas.defense * formation.effect.defense + areas.keeper;
    const formationBoost = Math.min(simulationModel.formationCap, Math.abs((formation.effect.attack - 1) + (formation.effect.midfield - 1) + (formation.effect.defense - 1)) * 50);
    const teamPlayers = picked.map((entry) => entry.player);
    const chemistry = options.ignoreChemistry ? 0 : chemistryFor(teamPlayers);
    const crisis = [];
    if (naturalSlotCounts.GK === 0) crisis.push({ type: 'noNaturalKeeper', penalty: simulationModel.crisisPenalties.noNaturalKeeper, text: 'Aucun vrai gardien dans les buts.' });
    if (naturalSlotCounts.DEF === 0) crisis.push({ type: 'noNaturalDefenders', penalty: simulationModel.crisisPenalties.noNaturalDefenders, text: 'Aucun defenseur naturel dans la ligne arriere.' });
    if (naturalSlotCounts.MID === 0) crisis.push({ type: 'noNaturalMidfielders', penalty: simulationModel.crisisPenalties.noNaturalMidfielders, text: 'Aucun milieu naturel pour tenir le tempo.' });
    if (naturalSlotCounts.FWD === 0) crisis.push({ type: 'noNaturalForwards', penalty: simulationModel.crisisPenalties.noNaturalForwards, text: 'Aucun attaquant naturel pour finir les actions.' });

    const severeMismatchPenalty = mismatches.filter((mismatch) => mismatch.fit < 0.5).length * simulationModel.crisisPenalties.severeMismatch;
    const crisisPenalty = crisis.reduce((sum, item) => sum + item.penalty, 0) + severeMismatchPenalty;
    const total = validation.valid ? Math.max(0, base / 10 + formationBoost + chemistry - crisisPenalty) : 0;
    const ranked = enriched
      .map(({ player, score, fit }) => ({ player, score: score - (1 - fit) * 20 }))
      .sort((a, b) => b.score - a.score);
    const averageRoleFit = enriched.length
      ? enriched.reduce((sum, item) => sum + item.fit, 0) / enriched.length
      : 0;
    const sortedMismatches = mismatches.sort((a, b) => b.severity - a.severity);
    const explainers = [
      ...crisis.map((item) => item.text),
      ...sortedMismatches.slice(0, 3).map((mismatch) => mismatch.text)
    ];

    return {
      valid: validation.valid,
      errors: validation.errors,
      total: Number(total.toFixed(2)),
      areas: {
        attack: Number((areas.attack / 10).toFixed(2)),
        midfield: Number((areas.midfield / 10).toFixed(2)),
        defense: Number((areas.defense / 10).toFixed(2)),
        keeper: Number((areas.keeper / 10).toFixed(2))
      },
      chemistry: Number(chemistry.toFixed(2)),
      roleFit: Number(averageRoleFit.toFixed(2)),
      mismatches: sortedMismatches,
      crisis,
      risk: Number(crisisPenalty.toFixed(2)),
      explainers,
      bestPlayer: ranked[0] ? ranked[0].player : null,
      weakLink: ranked[ranked.length - 1] ? ranked[ranked.length - 1].player : null,
      lineup: enriched.map(({ player, assignedPosition, fit, score }) => ({ player, assignedPosition, fit, score }))
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function stableHash(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let value = stableHash(seed) || 1;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) % 10000) / 10000;
  }

  function randomUnit(options, teamA, teamB) {
    if (options && options.seed !== undefined) {
      return seededRandom(`${options.seed}:${JSON.stringify(teamA.picks || [])}:${JSON.stringify(teamB.picks || [])}`);
    }
    return Math.random();
  }

  function simulateMatch(teamA, teamB, options = {}) {
    const strengthA = calculateTeamStrength(teamA);
    const strengthB = calculateTeamStrength(teamB);
    if (!strengthA.valid || !strengthB.valid) {
      return {
        valid: false,
        errors: [...strengthA.errors.map((error) => `A: ${error}`), ...strengthB.errors.map((error) => `B: ${error}`)]
      };
    }

    const delta = strengthA.total - strengthB.total;
    const pA = clamp(1 / (1 + Math.exp(-delta / simulationModel.probabilityScale)), 0.05, 0.95);
    const pB = 1 - pA;
    const randomness = randomUnit(options, teamA, teamB);
    const closeRatio = clamp(1 - Math.abs(delta) / simulationModel.funVariance.closeGameWindow, 0, 1);
    const upsetShift = (randomness - 0.5) * 2 * simulationModel.funVariance.maxUpsetShift * closeRatio;
    const decisionProbabilityA = clamp(pA + upsetShift, 0.05, 0.95);
    let winnerSide;
    if (pA >= simulationModel.funVariance.heavyFavoriteFloor) winnerSide = 'A';
    else if (pB >= simulationModel.funVariance.heavyFavoriteFloor) winnerSide = 'B';
    else winnerSide = randomness <= decisionProbabilityA ? 'A' : 'B';
    const winnerStrength = winnerSide === 'A' ? strengthA : strengthB;
    const loserStrength = winnerSide === 'A' ? strengthB : strengthA;
    const decidingFactors = topFactors(strengthA, strengthB);
    const leadExplainer = loserStrength.explainers[0]
      ? `${loserStrength.explainers[0]} ${decidingFactors[0].toLowerCase()} pese alors tres lourd.`
      : winnerStrength.explainers[0]
        ? `${winnerStrength.explainers[0]} mais ${decidingFactors[0].toLowerCase()} pese encore plus.`
        : `${decidingFactors[0].toLowerCase()} cree le plus gros ecart.`;

    const outcomeSeed = options.seed !== undefined ? options.seed : `${Date.now()}:${Math.random()}`;
    const timeline = buildTimeline(winnerSide, winnerStrength, loserStrength, decidingFactors, delta, 'emergent', {
      seed: outcomeSeed,
      flavorSeed: options.timelineSeed !== undefined ? options.timelineSeed : `${outcomeSeed}:timeline`
    });
    const finalScore = finalScoreForTimeline(timeline);
    const scoreBand = `${finalScore.A}-${finalScore.B}`;
    const liveFrames = buildLiveFrames(timeline, scoreBand);

    return {
      valid: true,
      probabilities: { A: Number(pA.toFixed(3)), B: Number(pB.toFixed(3)) },
      winner: winnerSide,
      scoreBand,
      decidingFactors,
      bestPlayer: winnerStrength.bestPlayer,
      weakLink: loserStrength.weakLink,
      why: `Gagnant ${winnerSide}, parce que ${leadExplainer}`,
      timeline: liveFrames.map((frame) => frame.event),
      liveFrames,
      tacticalReport: buildTacticalReport(strengthA, strengthB, winnerSide, decidingFactors, liveFrames)
    };
  }

  function topFactors(a, b) {
    const factors = [
      ['Pression offensive', a.areas.attack - b.areas.attack],
      ['Contrôle du milieu', a.areas.midfield - b.areas.midfield],
      ['Bloc défensif', a.areas.defense - b.areas.defense],
      ['Gardien décisif', a.areas.keeper - b.areas.keeper],
      ['Chimie collective', a.chemistry - b.chemistry],
      ['Roles respectes', (a.roleFit - b.roleFit) * 10],
      ['Risque tactique', b.risk - a.risk]
    ];
    return factors
      .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
      .slice(0, 3)
      .map(([label, value]) => `${label} ${value >= 0 ? 'A' : 'B'} +${Math.abs(value).toFixed(1)}`);
  }

  function shortFactor(factor) {
    return String(factor || 'Le duel cle').replace(/\s[AB]\s\+\d+(\.\d+)?$/, '');
  }

  function phaseForMinute(minute) {
    if (minute < 16) return 'Debut';
    if (minute < 46) return 'Premiere mi-temps';
    if (minute < 76) return 'Deuxieme mi-temps';
    return 'Money time';
  }

  function pickTimelineOption(options, seed, salt) {
    const index = Math.floor(seededRandom(`${seed}:${salt}`) * options.length);
    return options[index] || options[0];
  }

  function parseScoreBand(scoreBand) {
    const [scoreA = 0, scoreB = 0] = String(scoreBand || '0-0').split('-').map((goal) => safeNumber(goal));
    return { A: scoreA, B: scoreB };
  }

  function enrichTimelineEvent(event, seed, salt) {
    const labels = {
      momentum: 'Momentum',
      chance: 'Occasion',
      save: 'Arret',
      goal: 'But',
      duel: 'Duel',
      tactic: 'Tactique',
      card: 'Carton',
      sub: 'Coaching',
      var: 'VAR',
      finish: 'Final'
    };
    const pulse = Math.round(seededRandom(`${seed}:${salt}:pulse`) * 18);
    return {
      ...event,
      label: labels[event.type] || event.type,
      phase: phaseForMinute(event.minute),
      tag: event.tag || (event.team === 'neutral' ? 'Terrain neutre' : `Equipe ${event.team}`),
      intensity: clamp(Math.round(Math.abs(event.impact) * 7 + pulse + 18), 18, 100)
    };
  }

  function buildTimeline(winnerSide, winnerStrength, loserStrength, factors, delta, scoreBand = '1-0', options = {}) {
    const loserSide = winnerSide === 'A' ? 'B' : 'A';
    const safeWinner = winnerStrength.bestPlayer || { name: 'le capitaine', position: 'MID' };
    const safeLoser = loserStrength.bestPlayer || { name: 'le meneur adverse', position: 'MID' };
    const weakLink = loserStrength.weakLink || { name: 'le maillon faible', position: 'DEF' };
    const seed = options.seed || `${winnerSide}:${scoreBand}:${safeWinner.name}:${safeLoser.name}:${Math.random()}`;
    const flavorSeed = options.flavorSeed || seed;
    const primaryFactor = shortFactor(factors[0]);
    const secondaryFactor = shortFactor(factors[1]);

    const eventCount = clamp(9 + Math.round(Math.abs(delta) / 24), 9, 12);
    const state = { risk: { A: 0, B: 0 }, fatigue: { A: 0, B: 0 }, pressing: { A: 0, B: 0 }, momentum: { A: 50, B: 50 }, weakFlank: loserSide };
    const rawEvents = [];
    const scorersUsed = { A: new Set(), B: new Set() };

    for (let index = 0; index < eventCount - 1; index += 1) {
      const minuteBase = 4 + Math.round((index / Math.max(1, eventCount - 2)) * 78);
      const minute = clamp(minuteBase + Math.round((seededRandom(`${seed}:minute:${index}`) - 0.5) * 7), index === 0 ? 3 : rawEvents[index - 1].minute + 4, 88);
      const team = chooseEventTeam(winnerSide, loserSide, state, seed, index);
      let event = makeStateEvent({ minute, team, strength: team === winnerSide ? winnerStrength : loserStrength, opponentStrength: team === winnerSide ? loserStrength : winnerStrength, state, seed, index, primaryFactor, secondaryFactor, weakLink, safeWinner, safeLoser });
      if (event.type === 'chance' && shouldConvertChance(event, team, winnerSide, state, seed, index)) {
        event = makeGoalEvent({ minute, team, strength: team === winnerSide ? winnerStrength : loserStrength, opponentStrength: team === winnerSide ? loserStrength : winnerStrength, seed, index, primaryFactor, secondaryFactor, scorersUsed, xg: event.xg });
      }
      rawEvents.push(updateEventState(event, state));
    }

    ensureEventVariety(rawEvents, winnerStrength, loserStrength, winnerSide, loserSide, seed);
    ensureEmergentWinner(rawEvents, winnerSide, winnerStrength, loserStrength, seed, primaryFactor, secondaryFactor, scorersUsed);
    rawEvents.forEach((event, index) => applyFlavor(event, flavorSeed, index));
    rawEvents.push({
      minute: 90,
      team: 'neutral',
      type: 'finish',
      impact: 3,
      tag: 'Replay',
      text: 'Coup de sifflet, la timeline peut etre rejouee avec un scenario different.',
      detail: 'Resultat conserve: probabilites stables, generation des temps forts variable.',
      xg: 0,
      matchState: snapshotMatchState(state)
    });

    return applyScoreProgression(rawEvents)
      .sort((left, right) => left.minute - right.minute)
      .map((event, index) => enrichTimelineEvent(event, seed, `event-${index}`));
  }

  function ensureEventVariety(events, winnerStrength, loserStrength, winnerSide, loserSide, seed) {
    const required = ['chance', 'save', 'card', 'sub'];
    const replaceable = events.filter((event) => event.type !== 'goal');
    for (const type of required) {
      if (new Set(events.map((event) => event.type)).size >= 5) break;
      if (events.some((event) => event.type === type)) continue;
      const target = replaceable.find((event) => !required.includes(event.type)) || replaceable[0];
      if (!target) break;
      const team = target.team === 'A' || target.team === 'B' ? target.team : winnerSide;
      const strength = team === winnerSide ? winnerStrength : loserStrength;
      const opponentStrength = team === winnerSide ? loserStrength : winnerStrength;
      const creator = pickPlayerFrom(strength, ['MID', 'FWD'], seed, `variety-creator:${type}:${target.minute}`);
      const opponent = pickPlayerFrom(opponentStrength, ['GK', 'DEF', 'MID'], seed, `variety-opp:${type}:${target.minute}`);
      Object.assign(target, {
        team,
        type,
        tag: type === 'sub' ? 'Coaching' : type === 'card' ? 'Carton' : type === 'save' ? 'Arret' : 'Occasion',
        text: type === 'sub'
          ? `Le banc de l equipe ${team} ajuste le rythme autour de ${creator.name}.`
          : type === 'card'
            ? `${creator.name} stoppe une transition et prend un carton tactique.`
            : type === 'save'
              ? `${opponent.name} sort une parade sur la frappe de ${creator.name}.`
              : `${creator.name} cree une occasion nette entre les lignes.`,
        detail: `Cette sequence diversifie le scenario live et modifie la lecture tactique du match.`,
        shot: type === 'chance' || type === 'save' ? 1 : 0,
        shotOnTarget: type === 'save' ? 1 : 0,
        xg: type === 'chance' ? 0.12 : type === 'save' ? 0.18 : 0,
        cardedPlayer: type === 'card' ? creator.name : undefined,
        subOn: type === 'sub' ? creator.name : undefined,
        subOff: type === 'sub' ? opponent.name : undefined,
        keeper: type === 'save' ? opponent.name : undefined
      });
    }
  }

  function shouldConvertChance(event, team, winnerSide, state, seed, index) {
    const pressure = state.momentum[team] / 100 + state.pressing[team] * 0.04 - state.risk[team] * 0.03 - state.fatigue[team] * 0.025;
    const favoriteBoost = team === winnerSide ? 0.12 : -0.02;
    const threshold = clamp((event.xg || 0.08) + pressure * 0.34 + favoriteBoost, 0.18, 0.76);
    return seededRandom(`${seed}:convert:${team}:${index}`) < threshold;
  }

  function ensureEmergentWinner(events, winnerSide, winnerStrength, loserStrength, seed, primaryFactor, secondaryFactor, scorersUsed) {
    const score = finalScoreForTimeline(events);
    if (score[winnerSide] > score[winnerSide === 'A' ? 'B' : 'A']) return;
    const candidate = events
      .filter((event) => event.team === winnerSide && event.type !== 'goal' && event.type !== 'finish')
      .sort((a, b) => (b.xg || 0) - (a.xg || 0) || b.minute - a.minute)[0];
    if (!candidate) return;
    const replacement = makeGoalEvent({
      minute: candidate.minute,
      team: winnerSide,
      strength: winnerStrength,
      opponentStrength: loserStrength,
      seed,
      index: `pressure-${candidate.minute}`,
      primaryFactor,
      secondaryFactor,
      scorersUsed,
      xg: Math.max(candidate.xg || 0.18, 0.31)
    });
    Object.assign(candidate, replacement);
  }

  function applyFlavor(event, flavorSeed, index) {
    const notes = [
      'Le stade reagit immediatement.',
      'Le banc note ce detail pour la suite.',
      'La sequence change la lecture du momentum.',
      'Le ralenti confirme le decalage tactique.'
    ];
    const note = notes[Math.floor(seededRandom(`${flavorSeed}:note:${index}`) * notes.length)];
    if (event.type === 'finish') return;
    event.text = `${event.text} ${note}`;
    event.detail = `${event.detail} ${note}`;
  }

  function finalScoreForTimeline(timeline) {
    return timeline.reduce((score, event) => {
      if (event.type === 'goal' && (event.team === 'A' || event.team === 'B')) score[event.team] += 1;
      return score;
    }, { A: 0, B: 0 });
  }

  function playersFor(strength, positions) {
    const wanted = Array.isArray(positions) ? positions : [positions];
    const pool = (strength.lineup || [])
      .filter((entry) => wanted.includes(entry.assignedPosition) || wanted.includes(entry.player.position))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.player);
    if (pool.length) return pool;
    return [strength.bestPlayer || { name: 'Joueur cle', position: 'MID', role: 'Leader' }];
  }

  function pickPlayerFrom(strength, positions, seed, salt) {
    const pool = playersFor(strength, positions);
    return pool[Math.floor(seededRandom(`${seed}:${salt}`) * pool.length)] || pool[0];
  }

  function chooseEventTeam(winnerSide, loserSide, state, seed, index) {
    const winnerLean = 0.54 + (state.pressing[winnerSide] - state.risk[winnerSide]) * 0.025 + (state.weakFlank === loserSide ? 0.05 : 0);
    return seededRandom(`${seed}:team:${index}`) <= clamp(winnerLean, 0.38, 0.72) ? winnerSide : loserSide;
  }

  function makeGoalEvent({ minute, team, strength, opponentStrength, seed, index, primaryFactor, secondaryFactor, scorersUsed, xg }) {
    const scorerPool = playersFor(strength, ['FWD', 'MID']);
    const freshScorers = scorerPool.filter((player) => !scorersUsed[team].has(player.id || player.name));
    const scorerCandidates = freshScorers.length ? freshScorers : scorerPool;
    const scorer = scorerCandidates[Math.floor(seededRandom(`${seed}:scorer:${team}:${index}`) * scorerCandidates.length)] || scorerCandidates[0];
    scorersUsed[team].add(scorer.id || scorer.name);
    const assistPool = playersFor(strength, ['MID', 'FWD', 'DEF']).filter((player) => player.id !== scorer.id);
    const assister = assistPool[Math.floor(seededRandom(`${seed}:assist:${team}:${index}`) * assistPool.length)] || pickPlayerFrom(strength, ['MID', 'FWD', 'DEF'], seed, `assist:${team}:${index}`);
    const keeper = pickPlayerFrom(opponentStrength, 'GK', seed, `keeper-against:${team}:${index}`);
    const templates = [
      `${scorer.name} attaque le premier poteau et conclut une action verticale.`,
      `${scorer.name} finit en une touche apres une remise propre de ${assister.name}.`,
      `${scorer.name} profite du decalage cote faible et croise devant ${keeper.name}.`,
      `${scorer.name} marque apres une recuperation haute qui casse le bloc adverse.`
    ];
    const text = pickTimelineOption(templates.map((copy) => ({ copy })), seed, `goal-copy:${team}:${index}`).copy;
    return {
      minute,
      team,
      type: 'goal',
      impact: 9,
      tag: 'But',
      text,
      detail: `${secondaryFactor} prepare l action, puis ${primaryFactor.toLowerCase()} transforme la sequence en but.`,
      scorer: scorer.name,
      assister: assister.name,
      shot: 1,
      shotOnTarget: 1,
      xg: Number((xg || 0.22 + seededRandom(`${seed}:xg:${index}`) * 0.28).toFixed(2))
    };
  }

  function makeStateEvent({ minute, team, strength, opponentStrength, state, seed, index, primaryFactor, secondaryFactor, weakLink, safeWinner, safeLoser }) {
    const roll = seededRandom(`${seed}:event-type:${index}`) + state.risk[team] * 0.03 - state.pressing[team] * 0.02;
    const minutePressure = minute > 72 ? 0.06 : minute < 18 ? -0.04 : 0;
    const chanceCut = clamp(0.18 + state.pressing[team] * 0.025 + minutePressure, 0.12, 0.34);
    const saveCut = chanceCut + clamp(0.13 + state.momentum[team] / 520, 0.12, 0.24);
    const cardCut = saveCut + clamp(0.11 + state.risk[team] * 0.02, 0.1, 0.22);
    const subCut = cardCut + (minute > 50 ? 0.16 : 0.07);
    const tacticCut = subCut + 0.14;
    const varCut = tacticCut + 0.1;
    const creator = pickPlayerFrom(strength, ['MID', 'FWD'], seed, `creator:${team}:${index}`);
    const defender = pickPlayerFrom(opponentStrength, ['DEF', 'MID'], seed, `defender:${team}:${index}`);
    const keeper = pickPlayerFrom(opponentStrength, 'GK', seed, `keeper:${team}:${index}`);
    const carded = pickPlayerFrom(strength, ['DEF', 'MID'], seed, `card:${team}:${index}`);
    if (roll < chanceCut) {
      return {
        minute,
        team,
        type: 'chance',
        impact: 5,
        tag: `Equipe ${team}`,
        text: `${creator.name} trouve une fenetre de tir apres une course entre les lignes.`,
        detail: `${primaryFactor} force ${defender.name} a defendre en reculant.`,
        shot: 1,
        shotOnTarget: seededRandom(`${seed}:sot:${index}`) > 0.45 ? 1 : 0,
        xg: Number((0.06 + seededRandom(`${seed}:chance-xg:${index}`) * 0.16).toFixed(2))
      };
    }
    if (roll < saveCut) {
      return {
        minute,
        team,
        type: 'save',
        impact: -4,
        tag: 'Arret',
        text: `${keeper.name} repousse la frappe de ${creator.name}.`,
        detail: `${secondaryFactor} cree la situation, mais le gardien adverse preserve le score.`,
        keeper: keeper.name,
        shot: 1,
        shotOnTarget: 1,
        xg: Number((0.12 + seededRandom(`${seed}:save-xg:${index}`) * 0.18).toFixed(2))
      };
    }
    if (roll < cardCut) {
      return {
        minute,
        team,
        type: 'card',
        impact: -3,
        tag: 'Carton',
        text: `${carded.name} coupe une transition qui partait dans son dos.`,
        detail: `Le risque tactique monte et la prochaine sortie de balle de l equipe ${team} devient plus fragile.`,
        cardedPlayer: carded.name,
        cardCount: 1,
        xg: 0
      };
    }
    if (roll < subCut) {
      return {
        minute,
        team,
        type: 'sub',
        impact: 4,
        tag: 'Coaching',
        text: `Le banc de l equipe ${team} change le rythme autour de ${creator.name}.`,
        detail: `Le pressing gagne cinq metres et cible ${weakLink.name}.`,
        subOn: creator.name,
        subOff: defender.name,
        xg: 0
      };
    }
    if (roll < tacticCut) {
      return {
        minute,
        team,
        type: 'tactic',
        impact: 4,
        tag: 'Plan de jeu',
        text: `L equipe ${team} deplace son bloc pour attaquer le couloir faible.`,
        detail: `${primaryFactor} devient plus visible: ${safeWinner.name} et ${safeLoser.name} ne recoivent plus dans les memes zones.`,
        xg: 0
      };
    }
    if (roll < varCut) {
      return {
        minute,
        team,
        type: 'var',
        impact: 1,
        tag: 'VAR',
        text: 'Controle rapide dans la surface, le jeu reprend sans penalty.',
        detail: 'Decision VAR: pas de penalty, mais la tension reste dans la surface.',
        varDecision: 'Pas de penalty',
        xg: 0
      };
    }
    return {
      minute,
      team,
      type: 'duel',
      impact: 3,
      tag: `Equipe ${team}`,
      text: `${creator.name} gagne un duel qui remet son equipe dans le camp adverse.`,
      detail: `${secondaryFactor} nourrit la prochaine vague sans changer le score.`,
      xg: 0
    };
  }

  function updateEventState(event, state) {
    const side = event.team === 'A' || event.team === 'B' ? event.team : null;
    if (!side) return { ...event, matchState: snapshotMatchState(state) };
    const otherSide = side === 'A' ? 'B' : 'A';
    if (event.type === 'card') state.risk[side] += 2;
    if (event.type === 'sub' || event.type === 'tactic') {
      state.pressing[side] += 2;
      state.fatigue[side] = Math.max(0, state.fatigue[side] - 1);
    }
    if (event.type === 'goal') state.pressing[side] += 1;
    if (event.minute > 70) state.fatigue[side] += 1;
    const stateBoost = state.pressing[side] - state.risk[side] * 0.8 - state.fatigue[side] * 0.5 + (state.weakFlank === otherSide ? 1.2 : 0);
    const baseImpact = event.type === 'goal' ? Math.abs(event.impact) : safeNumber(event.impact);
    event.impact = Number(clamp(baseImpact + stateBoost, -12, 12).toFixed(1));
    state.momentum[side] = clamp(state.momentum[side] + event.impact, 8, 92);
    state.momentum[otherSide] = clamp(state.momentum[otherSide] - event.impact * 0.45, 8, 92);
    return { ...event, matchState: snapshotMatchState(state) };
  }

  function snapshotMatchState(state) {
    return {
      momentumA: Math.round(state.momentum.A),
      momentumB: Math.round(state.momentum.B),
      riskA: state.risk.A,
      riskB: state.risk.B,
      fatigueA: state.fatigue.A,
      fatigueB: state.fatigue.B,
      pressingA: state.pressing.A,
      pressingB: state.pressing.B,
      weakFlank: state.weakFlank
    };
  }

  function applyScoreProgression(events) {
    const running = { A: 0, B: 0 };
    return events.map((event) => {
      if (event.type === 'goal' && (event.team === 'A' || event.team === 'B')) {
        running[event.team] += 1;
        return {
          ...event,
          scoreA: running.A,
          scoreB: running.B,
          scoreAfter: `${running.A}-${running.B}`,
          isScoreChange: true,
          tag: `Score ${running.A}-${running.B}`
        };
      }
      return {
        ...event,
        scoreA: running.A,
        scoreB: running.B,
        scoreAfter: `${running.A}-${running.B}`,
        isScoreChange: false
      };
    });
  }

  function buildLiveFrames(timeline, scoreBand = '0-0') {
    const finalScore = parseScoreBand(scoreBand);
    let momentumA = 50;
    let momentumB = 50;
    const stats = {
      A: { shots: 0, threat: 0, cards: 0, possession: 50, xg: 0 },
      B: { shots: 0, threat: 0, cards: 0, possession: 50, xg: 0 }
    };

    return timeline.map((event, index) => {
      const side = event.team === 'A' || event.team === 'B' ? event.team : null;
      const otherSide = side === 'A' ? 'B' : 'A';
      const impact = safeNumber(event.impact);
      if (side) {
        const tacticalImpact = event.type === 'goal'
          ? Math.abs(impact)
          : event.type === 'card'
            ? -Math.abs(impact)
            : impact;
        const swing = clamp(tacticalImpact * 1.8, -16, 18);
        if (side === 'A') {
          momentumA = clamp(momentumA + swing, 8, 92);
          momentumB = clamp(momentumB - swing * 0.55, 8, 92);
        } else {
          momentumB = clamp(momentumB + swing, 8, 92);
          momentumA = clamp(momentumA - swing * 0.55, 8, 92);
        }
        stats[side].threat = clamp(stats[side].threat + Math.max(1, Math.round((event.intensity || 20) / 22)), 0, 99);
        stats[side].xg = Number(((stats[side].xg || 0) + safeNumber(event.xg)).toFixed(2));
        stats[side].possession = clamp(stats[side].possession + Math.round(swing / 3), 35, 65);
        stats[otherSide].possession = 100 - stats[side].possession;
      }
      if (side && ['chance', 'goal', 'save'].includes(event.type)) stats[side].shots += event.shot ? 1 : 0;
      if (side && event.type === 'card') stats[side].cards += event.cardCount || 1;

      const scoreA = Number.isFinite(Number(event.scoreA)) ? Number(event.scoreA) : index === timeline.length - 1 ? finalScore.A : 0;
      const scoreB = Number.isFinite(Number(event.scoreB)) ? Number(event.scoreB) : index === timeline.length - 1 ? finalScore.B : 0;
      const frame = {
        minute: event.minute,
        status: event.type === 'finish' ? 'FT' : 'LIVE',
        scoreA,
        scoreB,
        momentumA: Math.round(momentumA),
        momentumB: Math.round(momentumB),
        stats: {
          shotsA: Number(stats.A.shots.toFixed(1)),
          shotsB: Number(stats.B.shots.toFixed(1)),
          threatA: stats.A.threat,
          threatB: stats.B.threat,
          possessionA: stats.A.possession,
          possessionB: stats.B.possession,
          cardsA: stats.A.cards,
          cardsB: stats.B.cards,
          xgA: stats.A.xg || 0,
          xgB: stats.B.xg || 0
        },
        event: { ...event, scoreA, scoreB, momentumA: Math.round(momentumA), momentumB: Math.round(momentumB) }
      };
      return frame;
    });
  }

  function buildTacticalReport(strengthA, strengthB, winnerSide, factors, liveFrames) {
    const finalFrame = liveFrames[liveFrames.length - 1] || { momentumA: 50, momentumB: 50, stats: {} };
    const firstHalf = liveFrames.find((frame) => frame.minute >= 39) || liveFrames[0] || finalFrame;
    const turningPoint = liveFrames.find((frame) => frame.event && frame.event.isScoreChange) || liveFrames[0] || finalFrame;
    const lateFrame = liveFrames.find((frame) => frame.minute >= 72) || finalFrame;
    const loserSide = winnerSide === 'A' ? 'B' : 'A';
    const winnerStrength = winnerSide === 'A' ? strengthA : strengthB;
    const loserStrength = winnerSide === 'A' ? strengthB : strengthA;
    const weakMismatch = loserStrength.mismatches[0];
    return [
      { label: 'Mentalite', value: `Equipe ${winnerSide} a gagne le territoire en ${shortFactor(factors[0]).toLowerCase()}.` },
      { label: 'Momentum 1MT', value: `A ${firstHalf.momentumA}/100 - B ${firstHalf.momentumB}/100 autour de la ${firstHalf.minute}e minute.` },
      { label: 'Momentum final', value: `A ${finalFrame.momentumA}/100 - B ${finalFrame.momentumB}/100 apres les derniers temps forts.` },
      { label: 'Tournant', value: `${turningPoint.minute}' ${turningPoint.event.label}: ${turningPoint.event.text}` },
      { label: 'Meilleur ajustement', value: `${lateFrame.minute}' le plan cible ${shortFactor(factors[1]).toLowerCase()} pour proteger le resultat.` },
      { label: 'Plan rate', value: `Equipe ${loserSide} subit ${shortFactor(factors[0]).toLowerCase()} et perd le controle des zones chaudes.` },
      { label: 'Zone faible', value: weakMismatch ? weakMismatch.text : `${loserStrength.weakLink.name} est reste le joueur le plus cible.` },
      { label: 'Joueur du match', value: `${winnerStrength.bestPlayer.name} porte le plan gagnant, tandis que ${loserStrength.weakLink.name} absorbe la pression.` },
      { label: 'Pressing', value: `Menace A ${finalFrame.stats.threatA || 0} - B ${finalFrame.stats.threatB || 0}, xG A ${(finalFrame.stats.xgA || 0).toFixed(2)} - B ${(finalFrame.stats.xgB || 0).toFixed(2)}.` },
      { label: 'Verdict FM', value: `Le plan de l equipe ${loserSide} craque surtout sur ${shortFactor(factors[0]).toLowerCase()}, pas sur un simple tirage aleatoire.` }
    ];
  }

  function normalizeText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function searchPlayers({ query = '', position = 'ALL', league = 'ALL' } = {}) {
    const q = normalizeText(query);
    return players
      .filter((player) => position === 'ALL' || player.position === position)
      .filter((player) => league === 'ALL' || player.league === league)
      .filter((player) => {
        if (!q) return true;
        return normalizeText(`${player.name} ${player.team} ${player.league} ${player.role}`).includes(q);
      })
      .sort((a, b) => b.rating - a.rating || b.minutes - a.minutes)
      .slice(0, 24);
  }

  const browserApi = {
    players,
    formations,
    simulationModel,
    weights,
    normalizePlayer,
    validateTeam,
    calculateTeamStrength,
    simulateMatch,
    searchPlayers,
    buildFormationSlots,
    buildLiveFrames
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => boot(browserApi));
  }

  return browserApi;
});

function boot(api) {
  const state = {
    activeTeam: 'A',
    activeSlot: null,
    query: '',
    league: 'ALL',
    matchSeed: null,
    timelineReplay: 0,
    liveTimer: null,
    liveMinute: 0,
    revealedFrames: 0,
    activeFrame: null,
    latestResult: null,
    replayPaused: false,
    activeTab: 'resume',
    teams: {
      A: { formation: '4-3-3', picks: [] },
      B: { formation: '4-3-3', picks: [] }
    }
  };

  const $ = (selector) => document.querySelector(selector);
  const draftBoard = $('#draftBoard');
  const picker = $('#playerPicker');
  const pickerList = $('#pickerList');
  const pickerTitle = $('#pickerTitle');
  const search = $('#playerSearch');
  const matchTimeline = $('#matchTimeline');
  const liveStatus = $('#liveStatus');
  const liveClock = $('#liveClock');
  const liveScoreA = $('#liveScoreA');
  const liveScoreB = $('#liveScoreB');
  const liveEventLabel = $('#liveEventLabel');
  const liveEventText = $('#liveEventText');
  const momentumA = $('#momentumA');
  const momentumB = $('#momentumB');
  const liveNameA = $('#liveNameA');
  const liveNameB = $('#liveNameB');
  const headerTitle = $('#headerTitle');
  const headerStatus = $('#headerStatus');
  const headerScoreline = $('#headerScoreline');
  const headerEvent = $('#headerEvent');

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function invalidateMatchReplay() {
    clearLiveTimer();
    state.matchSeed = null;
    state.timelineReplay = 0;
    state.latestResult = null;
    state.activeFrame = null;
    state.liveMinute = 0;
    state.revealedFrames = 0;
    state.replayPaused = false;
  }

  function clearLiveTimer() {
    if (state.liveTimer) window.clearInterval(state.liveTimer);
    state.liveTimer = null;
  }

  function render() {
    renderScoreHeader();
    renderDraftBoard();
    renderPicker();
  }

  function renderScoreHeader() {
    const strengthA = api.calculateTeamStrength(state.teams.A);
    const strengthB = api.calculateTeamStrength(state.teams.B);
    const nameA = teamNameFor('A');
    const nameB = teamNameFor('B');
    if (state.latestResult) {
      const frame = state.activeFrame || { scoreA: 0, scoreB: 0, status: 'LIVE', minute: state.liveMinute || 0, event: null };
      const activeEvent = frame.event;
      headerTitle.textContent = `${nameA} v ${nameB}`;
      headerStatus.textContent = `${frame.status} ${String(frame.minute).padStart(2, '0')}'`;
      headerScoreline.textContent = `${frame.scoreA}-${frame.scoreB}`;
      headerEvent.textContent = activeEvent ? activeEvent.text : 'Coup d envoi';
      return;
    }
    headerTitle.textContent = 'Draft duel';
    headerStatus.textContent = 'Draft';
    headerScoreline.textContent = `${strengthA.valid ? strengthA.total.toFixed(1) : `${state.teams.A.picks.length}/11`} - ${strengthB.valid ? strengthB.total.toFixed(1) : `${state.teams.B.picks.length}/11`}`;
    headerEvent.textContent = 'Compose les XI';
  }

  function teamNameFor(side) {
    const picked = teamPlayersFor(side);
    if (!picked.length) return `Equipe ${side}`;
    const clubs = picked.reduce((memo, { player }) => {
      memo[player.team] = (memo[player.team] || 0) + 1;
      return memo;
    }, {});
    const [club, count] = Object.entries(clubs).sort((a, b) => b[1] - a[1])[0] || [];
    if (count >= 3) return club;
    const captain = picked.slice().sort((a, b) => b.player.rating - a.player.rating)[0];
    return captain ? `XI ${captain.player.name.split(' ').slice(-1)[0]}` : `Equipe ${side}`;
  }

  function renderDraftBoard() {
    draftBoard.innerHTML = '';
    for (const side of ['A', 'B']) {
      const team = state.teams[side];
      const section = document.createElement('section');
      section.className = 'team-panel';
      section.innerHTML = `
        <div class="team-panel__header">
          <h2>Equipe ${side}</h2>
          <div class="formation-tabs" data-team="${side}">
            ${Object.keys(api.formations).map((formation) => `<button class="formation-chip ${team.formation === formation ? 'is-active' : ''}" data-formation="${formation}" type="button">${formation}</button>`).join('')}
          </div>
        </div>
        <div class="formation-board" data-team="${side}"></div>
      `;
      const board = section.querySelector('.formation-board');
      for (const slot of api.buildFormationSlots(team.formation)) {
        const pick = team.picks.find((item) => item.slotId === slot.id);
        const player = pick ? api.players.find((candidate) => candidate.id === pick.playerId) : null;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `slot-button slot-${slot.position.toLowerCase()} ${player ? 'is-filled' : ''}`;
        button.dataset.team = side;
        button.dataset.slot = slot.id;
        button.dataset.position = slot.position;
        button.innerHTML = player
          ? `<span class="slot-pos">${slot.position}</span><strong>${player.name}</strong><small>${player.team} - ${player.rating.toFixed(1)}</small>`
          : `<span class="slot-pos">${slot.position}</span><strong>${slot.label}</strong><small>Toucher pour choisir</small>`;
        board.appendChild(button);
      }
      draftBoard.appendChild(section);
    }
  }

  function openPlayerPicker(team, slotId, position) {
    state.activeTeam = team;
    state.activeSlot = { id: slotId, position };
    picker.hidden = false;
    pickerTitle.textContent = `Choisir joueur - ${position} Equipe ${team}`;
    search.focus();
    renderPicker();
  }

  function closePlayerPicker() {
    picker.hidden = true;
    state.activeSlot = null;
  }

  function renderPicker() {
    if (!state.activeSlot) return;
    const alreadyPicked = new Set(state.teams[state.activeTeam].picks.map((pick) => pick.playerId));
    const results = api.searchPlayers({ query: state.query, position: 'ALL', league: state.league });
    pickerList.innerHTML = results.map((player) => `
      <button class="player-row" type="button" data-player="${player.id}" ${alreadyPicked.has(player.id) ? 'disabled' : ''}>
        <span class="player-avatar" aria-hidden="true">${player.position}</span>
        <span><strong>${player.name}</strong><small>${player.team} - ${player.league} - ${player.role}</small></span>
        <b>${player.rating.toFixed(1)}</b>
      </button>
    `).join('');
  }

  function pickPlayer(playerId) {
    if (!state.activeSlot) return;
    const team = state.teams[state.activeTeam];
    team.picks = team.picks.filter((pick) => pick.slotId !== state.activeSlot.id && pick.playerId !== playerId);
    team.picks.push({ slotId: state.activeSlot.id, slotIndex: team.picks.length, playerId });
    invalidateMatchReplay();
    closePlayerPicker();
    render();
  }

  function autoFill() {
    const globalUsed = new Set();
    for (const side of ['A', 'B']) {
      const team = state.teams[side];
      const used = new Set();
      team.picks = api.buildFormationSlots(team.formation).map((slot, index) => {
        const pool = api.players.filter((player) => player.position === slot.position && !used.has(player.id) && !globalUsed.has(player.id));
        const offset = side === 'A' ? index : Math.floor(pool.length * 0.42) + index;
        const player = pool[offset % pool.length] || api.players.find((candidate) => candidate.position === slot.position && !used.has(candidate.id));
        used.add(player.id);
        globalUsed.add(player.id);
        return { slotId: slot.id, slotIndex: index, playerId: player.id };
      });
    }
    invalidateMatchReplay();
    render();
  }

  function renderResult(result) {
    const resultPanel = $('#result');
    resultPanel.hidden = false;
    if (!result.valid) {
      clearLiveTimer();
      $('#winner').textContent = 'Equipes invalides';
      $('#probabilities').textContent = result.errors.join(' ');
      $('#bestPlayer').textContent = '-';
      $('#weakLink').textContent = '-';
      $('#whyResult').textContent = '-';
      $('#decidingFactors').innerHTML = '';
      $('#tacticalReport').innerHTML = '';
      matchTimeline.innerHTML = '';
      $('#tabPanel').innerHTML = '';
      updateLiveCard(null);
      return;
    }

    state.latestResult = result;
    state.replayPaused = false;
    $('#winner').textContent = `Gagnant probable : Equipe ${result.winner}`;
    $('#probabilities').textContent = `A ${(result.probabilities.A * 100).toFixed(1)}% vs B ${(result.probabilities.B * 100).toFixed(1)}% - score attendu ${result.scoreBand}`;
    $('#bestPlayer').textContent = `${result.bestPlayer.name} (${result.bestPlayer.role})`;
    $('#weakLink').textContent = `${result.weakLink.name} sous pression`;
    $('#whyResult').textContent = result.why;
    $('#decidingFactors').innerHTML = result.decidingFactors.map((factor) => `<li>${factor}</li>`).join('');
    renderTacticalReport(result.tacticalReport);
    renderTabPanel();
    startLiveReplay(result);
  }

  function eventIcon(type) {
    const labels = { goal: 'But', card: 'Carton', save: 'Arret', var: 'VAR', sub: 'Changement', tactic: 'Tactique', chance: 'Occasion', momentum: 'Momentum', duel: 'Duel', finish: 'Final' };
    return labels[type] || 'Evenement';
  }

  function eventMarkerText(type) {
    const labels = { goal: 'GO', card: 'YC', save: 'SV', var: 'VR', sub: 'IN', tactic: 'TX', chance: 'CH', momentum: 'MO', duel: 'DL', finish: 'FT' };
    return labels[type] || 'EV';
  }

  function renderTimeline(timeline, visibleCount = timeline.length, activeIndex = visibleCount - 1) {
    const visible = timeline.slice(0, visibleCount);
    matchTimeline.innerHTML = visible.map((event, index) => `
      <li class="timeline-event timeline-${escapeHtml(event.type)} team-${escapeHtml(event.team)} ${index === activeIndex ? 'is-current' : ''}">
        <button class="timeline-trigger" type="button" data-timeline-index="${index}" aria-expanded="false">
          <span class="timeline-minute">${event.minute}'</span>
          <span class="timeline-type"><b class="event-marker marker-${escapeHtml(event.type)}" aria-label="${eventIcon(event.type)}">${eventMarkerText(event.type)}</b>${escapeHtml(event.label || event.type)}</span>
          <span class="timeline-copy">
            <span class="timeline-phase">${escapeHtml(event.phase || '')} - ${escapeHtml(event.tag || '')}${event.isScoreChange && !String(event.tag || '').startsWith('Score') ? ` - ${event.scoreA}-${event.scoreB}` : ''}</span>
            <span class="timeline-text">${escapeHtml(event.text)}</span>
          </span>
          <span class="timeline-meter" aria-label="Intensite ${event.intensity || 0} sur 100"><span style="width: ${event.intensity || 0}%"></span></span>
        </button>
        <div class="timeline-detail" hidden>
          <span>${event.scorer ? `Buteur ${escapeHtml(event.scorer)} - ` : ''}${event.assister ? `Passeur ${escapeHtml(event.assister)} - ` : ''}${event.keeper ? `Gardien ${escapeHtml(event.keeper)} - ` : ''}${event.cardedPlayer ? `Carton ${escapeHtml(event.cardedPlayer)} - ` : ''}${event.subOn ? `Entree ${escapeHtml(event.subOn)} - ` : ''}${event.subOff ? `Sortie ${escapeHtml(event.subOff)} - ` : ''}${event.varDecision ? `${escapeHtml(event.varDecision)} - ` : ''}xG ${(event.xg || 0).toFixed(2)} - Impact ${event.impact > 0 ? '+' : ''}${event.impact}</span>
          <p>${escapeHtml(event.detail || 'Aucun detail tactique supplementaire.')}</p>
        </div>
      </li>
    `).join('');
  }

  function renderTacticalReport(report = []) {
    $('#tacticalReport').innerHTML = report.map((item) => `
      <article>
        <strong>${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.value)}</p>
      </article>
    `).join('');
  }

  function teamPlayersFor(side) {
    return state.teams[side].picks
      .map((pick) => {
        const player = api.players.find((candidate) => candidate.id === pick.playerId);
        return player ? { pick, player } : null;
      })
      .filter(Boolean);
  }

  function renderTabPanel() {
    const result = state.latestResult;
    const frame = state.activeFrame || (result && result.liveFrames && result.liveFrames[0]);
    if (!result) {
      $('#tabPanel').innerHTML = '';
      return;
    }
    for (const button of document.querySelectorAll('.match-tabs button')) {
      button.classList.toggle('is-active', button.dataset.tab === state.activeTab);
    }
    matchTimeline.hidden = state.activeTab !== 'highlights';
    $('#rematch').hidden = state.activeTab !== 'highlights';
    $('#tacticalReport').hidden = state.activeTab !== 'resume';
    if (state.activeTab === 'highlights') {
      $('#tabPanel').innerHTML = `<p>${result.timeline.length} temps forts generes. Le fil de match se revele avec l horloge.</p>`;
      return;
    }
    if (state.activeTab === 'stats') {
      const stats = frame ? frame.stats : result.liveFrames.at(-1).stats;
      $('#tabPanel').innerHTML = `
        <div class="tab-stat-grid">
          <span>Tirs <strong>${stats.shotsA} - ${stats.shotsB}</strong></span>
          <span>xG <strong>${stats.xgA.toFixed(2)} - ${stats.xgB.toFixed(2)}</strong></span>
          <span>Menace <strong>${stats.threatA} - ${stats.threatB}</strong></span>
          <span>Possession <strong>${stats.possessionA} - ${stats.possessionB}</strong></span>
          <span>Cartons <strong>${stats.cardsA} - ${stats.cardsB}</strong></span>
        </div>
      `;
      return;
    }
    if (state.activeTab === 'lineups') {
      $('#tabPanel').innerHTML = ['A', 'B'].map((side) => `
        <article>
          <strong>${escapeHtml(teamNameFor(side))}</strong>
          <p>${teamPlayersFor(side).slice(0, 11).map(({ player }) => escapeHtml(player.name)).join(', ')}</p>
        </article>
      `).join('');
      return;
    }
    if (state.activeTab === 'ratings') {
      const rated = ['A', 'B'].flatMap((side) => teamPlayersFor(side).slice(0, 5).map(({ player }, index) => ({
        side,
        player,
        rating: (7.8 - index * 0.18 + (result.winner === side ? 0.35 : 0)).toFixed(1)
      })));
      $('#tabPanel').innerHTML = rated.map((item) => `
        <span class="rating-row"><b>${escapeHtml(item.player.name)}</b><small>${escapeHtml(teamNameFor(item.side))}</small><strong>${item.rating}</strong></span>
      `).join('');
      return;
    }
    $('#tabPanel').innerHTML = `<p>${result.why}</p>`;
  }

  function updateLiveCard(frame) {
    const activeEvent = frame && frame.event;
    liveStatus.textContent = frame ? frame.status : 'Avant-match';
    liveClock.textContent = `${String(frame ? frame.minute : state.liveMinute).padStart(2, '0')}'`;
    liveNameA.textContent = teamNameFor('A');
    liveNameB.textContent = teamNameFor('B');
    liveScoreA.textContent = frame ? frame.scoreA : 0;
    liveScoreB.textContent = frame ? frame.scoreB : 0;
    liveEventLabel.textContent = activeEvent ? `${eventIcon(activeEvent.type)} - ${activeEvent.label || activeEvent.type}` : 'Match center';
    liveEventText.textContent = activeEvent ? activeEvent.text : 'Lance une simulation pour suivre les temps forts.';
    momentumA.style.width = `${frame ? frame.momentumA : 50}%`;
    momentumB.style.width = `${frame ? frame.momentumB : 50}%`;
    $('#shotsStat').textContent = frame ? `${frame.stats.shotsA} - ${frame.stats.shotsB}` : '0 - 0';
    $('#xgStat').textContent = frame ? `${frame.stats.xgA.toFixed(2)} - ${frame.stats.xgB.toFixed(2)}` : '0.00 - 0.00';
    $('#threatStat').textContent = frame ? `${frame.stats.threatA} - ${frame.stats.threatB}` : '0 - 0';
    $('#cardsStat').textContent = frame ? `${frame.stats.cardsA} - ${frame.stats.cardsB}` : '0 - 0';
    $('#possessionStat').textContent = frame ? `${frame.stats.possessionA} - ${frame.stats.possessionB}` : '50 - 50';
    state.activeFrame = frame;
    renderScoreHeader();
    renderTabPanel();
    updateReplayControls();
  }

  function updateReplayControls() {
    const hasResult = Boolean(state.latestResult);
    const finished = hasResult && state.liveMinute >= 90;
    const hasNext = hasResult && state.latestResult.liveFrames.some((frame) => frame.minute > state.liveMinute);
    const pauseButton = $('#pauseReplay');
    const nextButton = $('#nextHighlight');
    const finalButton = $('#instantResult');
    pauseButton.textContent = state.replayPaused ? 'Reprendre' : 'Pause';
    nextButton.textContent = 'Temps fort suivant';
    finalButton.textContent = finished ? 'Termine' : 'Resultat final';
    pauseButton.disabled = !hasResult || finished;
    nextButton.disabled = !hasNext || finished;
    finalButton.disabled = !hasResult || finished;
    pauseButton.classList.toggle('is-active', state.replayPaused);
    finalButton.classList.toggle('is-active', finished);
  }

  function revealFramesThroughMinute(result) {
    const frames = result.liveFrames || [];
    let nextCount = state.revealedFrames;
    while (nextCount < frames.length && frames[nextCount].minute <= state.liveMinute) {
      nextCount += 1;
    }
    if (nextCount !== state.revealedFrames) {
      state.revealedFrames = nextCount;
      updateLiveCard(frames[nextCount - 1]);
      renderTimeline(result.timeline, nextCount, nextCount - 1);
    } else {
      liveClock.textContent = `${String(state.liveMinute).padStart(2, '0')}'`;
    }
  }

  function startLiveReplay(result) {
    clearLiveTimer();
    state.liveMinute = 0;
    state.revealedFrames = 0;
    state.replayPaused = false;
    $('#pauseReplay').textContent = 'Pause';
    updateLiveCard(null);
    renderTimeline(result.timeline, 0);
    updateReplayControls();
    const tickSize = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 15 : 1;
    state.liveTimer = window.setInterval(() => {
      if (state.replayPaused) return;
      state.liveMinute = Math.min(90, state.liveMinute + tickSize);
      revealFramesThroughMinute(result);
      if (state.liveMinute >= 90) {
        clearLiveTimer();
        const finalFrame = result.liveFrames[result.liveFrames.length - 1];
        updateLiveCard(finalFrame);
        renderTimeline(result.timeline, result.timeline.length, result.timeline.length - 1);
        updateReplayControls();
      }
    }, 70);
  }

  function runSimulation({ replay = false } = {}) {
    if (!replay || !state.matchSeed) {
      state.matchSeed = `${Date.now()}:${Math.random()}`;
      state.timelineReplay = 0;
    } else {
      state.timelineReplay += 1;
    }

    renderResult(api.simulateMatch(state.teams.A, state.teams.B, {
      seed: state.matchSeed,
      timelineSeed: `${state.matchSeed}:timeline-${state.timelineReplay}`
    }));
  }

  function quickLive() {
    autoFill();
    runSimulation();
    window.setTimeout(() => {
      $('#result').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }, 40);
  }

  function toggleReplayPause() {
    if (!state.latestResult || !state.liveTimer) return;
    state.replayPaused = !state.replayPaused;
    updateReplayControls();
  }

  function skipToNextHighlight() {
    const result = state.latestResult;
    if (!result) return;
    const nextFrame = result.liveFrames.find((frame) => frame.minute > state.liveMinute);
    if (!nextFrame) return;
    state.liveMinute = nextFrame.minute;
    revealFramesThroughMinute(result);
    updateReplayControls();
  }

  function showInstantResult() {
    const result = state.latestResult;
    if (!result) return;
    clearLiveTimer();
    state.liveMinute = 90;
    state.revealedFrames = result.timeline.length;
    updateLiveCard(result.liveFrames[result.liveFrames.length - 1]);
    renderTimeline(result.timeline, result.timeline.length, result.timeline.length - 1);
    updateReplayControls();
  }

  draftBoard.addEventListener('click', (event) => {
    const formationButton = event.target.closest('.formation-chip');
    if (formationButton) {
      const team = formationButton.closest('.formation-tabs').dataset.team;
      state.teams[team].formation = formationButton.dataset.formation;
      state.teams[team].picks = [];
      invalidateMatchReplay();
      render();
      return;
    }
    const slot = event.target.closest('.slot-button');
    if (slot) openPlayerPicker(slot.dataset.team, slot.dataset.slot, slot.dataset.position);
  });

  pickerList.addEventListener('click', (event) => {
    const row = event.target.closest('.player-row');
    if (row && !row.disabled) pickPlayer(row.dataset.player);
  });

  search.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderPicker();
  });

  $('#leagueFilter').addEventListener('click', (event) => {
    const chip = event.target.closest('.league-chip');
    if (!chip) return;
    state.league = chip.dataset.league;
    for (const button of $('#leagueFilter').querySelectorAll('.league-chip')) {
      button.classList.toggle('is-active', button === chip);
    }
    renderPicker();
  });
  $('#closePicker').addEventListener('click', closePlayerPicker);
  $('#autoFill').addEventListener('click', autoFill);
  $('#quickLive').addEventListener('click', quickLive);
  $('#simulate').addEventListener('click', () => runSimulation());
  $('#rematch').addEventListener('click', () => runSimulation({ replay: true }));
  $('#pauseReplay').addEventListener('click', toggleReplayPause);
  $('#nextHighlight').addEventListener('click', skipToNextHighlight);
  $('#instantResult').addEventListener('click', showInstantResult);
  document.querySelector('.match-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (!button) return;
    state.activeTab = button.dataset.tab;
    renderTabPanel();
  });
  matchTimeline.addEventListener('click', (event) => {
    const trigger = event.target.closest('.timeline-trigger');
    if (!trigger) return;
    const item = trigger.closest('.timeline-event');
    const detail = item.querySelector('.timeline-detail');
    const isOpen = !item.classList.contains('is-open');
    item.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
    detail.hidden = !isOpen;
  });

  render();
}

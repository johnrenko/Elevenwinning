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

  const weights = {
    attack: { rating: 5, goals: 2.8, assists: 1.7, shots: 0.22, minutes: 0.004 },
    midfield: { rating: 5.5, passes: 0.014, assists: 2, tackles: 0.2, minutes: 0.005 },
    defense: { rating: 5.3, tackles: 0.35, cleanSheets: 1.5, cards: -0.85, goalsConceded: -0.45, minutes: 0.004 },
    keeper: { rating: 6, saves: 0.16, cleanSheets: 2, goalsConceded: -0.75, minutes: 0.004 },
    probabilityScale: 18,
    chemistryCap: 5,
    formationCap: 3
  };

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

  function positionScore(player, assignedPosition = player.position) {
    const reliability = Math.min(1, player.minutes / 2700) * 8 + Math.min(1, player.appearances / 30) * 4;
    if (assignedPosition === 'GK') {
      return player.rating * weights.keeper.rating + player.saves * weights.keeper.saves + player.cleanSheets * weights.keeper.cleanSheets + player.goalsConceded * weights.keeper.goalsConceded + player.minutes * weights.keeper.minutes + reliability;
    }
    if (assignedPosition === 'DEF') {
      return player.rating * weights.defense.rating + player.tackles * weights.defense.tackles + player.cleanSheets * weights.defense.cleanSheets + player.cards * weights.defense.cards + player.goalsConceded * weights.defense.goalsConceded + player.minutes * weights.defense.minutes + reliability;
    }
    if (assignedPosition === 'MID') {
      return player.rating * weights.midfield.rating + player.passes * weights.midfield.passes + player.assists * weights.midfield.assists + player.tackles * weights.midfield.tackles + player.minutes * weights.midfield.minutes + reliability;
    }
    return player.rating * weights.attack.rating + player.goals * weights.attack.goals + player.assists * weights.attack.assists + player.shots * weights.attack.shots + player.minutes * weights.attack.minutes + reliability;
  }

  function assignedPositionForPick(pick, player) {
    const slotId = pick && typeof pick.slotId === 'string' ? pick.slotId : '';
    const slotPosition = slotId.split('-')[0];
    return formations['4-3-3'][slotPosition] !== undefined ? slotPosition : player.position;
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
    for (const { pick, player } of picked) {
      const assignedPosition = assignedPositionForPick(pick, player);
      if (assignedPosition === 'FWD') areas.attack += positionScore(player, assignedPosition);
      if (assignedPosition === 'MID') areas.midfield += positionScore(player, assignedPosition);
      if (assignedPosition === 'DEF') areas.defense += positionScore(player, assignedPosition);
      if (assignedPosition === 'GK') areas.keeper += positionScore(player, assignedPosition);
    }

    const formation = formations[team.formation] || formations['4-3-3'];
    const base = areas.attack * formation.effect.attack + areas.midfield * formation.effect.midfield + areas.defense * formation.effect.defense + areas.keeper;
    const formationBoost = Math.min(weights.formationCap, Math.abs((formation.effect.attack - 1) + (formation.effect.midfield - 1) + (formation.effect.defense - 1)) * 50);
    const teamPlayers = picked.map((entry) => entry.player);
    const chemistry = options.ignoreChemistry ? 0 : chemistryFor(teamPlayers);
    const total = validation.valid ? base / 10 + formationBoost + chemistry : 0;
    const ranked = picked
      .map(({ pick, player }) => ({ player, score: positionScore(player, assignedPositionForPick(pick, player)) }))
      .sort((a, b) => b.score - a.score);

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
      bestPlayer: ranked[0] ? ranked[0].player : null,
      weakLink: ranked[ranked.length - 1] ? ranked[ranked.length - 1].player : null
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function simulateMatch(teamA, teamB) {
    const strengthA = calculateTeamStrength(teamA);
    const strengthB = calculateTeamStrength(teamB);
    if (!strengthA.valid || !strengthB.valid) {
      return {
        valid: false,
        errors: [...strengthA.errors.map((error) => `A: ${error}`), ...strengthB.errors.map((error) => `B: ${error}`)]
      };
    }

    const delta = strengthA.total - strengthB.total;
    const pA = clamp(1 / (1 + Math.exp(-delta / weights.probabilityScale)), 0.05, 0.95);
    const pB = 1 - pA;
    const winnerSide = pA >= pB ? 'A' : 'B';
    const winnerStrength = winnerSide === 'A' ? strengthA : strengthB;
    const loserStrength = winnerSide === 'A' ? strengthB : strengthA;
    const scoreBand = pA > 0.62 ? '2-1' : pB > 0.62 ? '1-2' : '1-1';
    const decidingFactors = topFactors(strengthA, strengthB);

    return {
      valid: true,
      probabilities: { A: Number(pA.toFixed(3)), B: Number(pB.toFixed(3)) },
      winner: winnerSide,
      scoreBand,
      decidingFactors,
      bestPlayer: winnerStrength.bestPlayer,
      weakLink: loserStrength.weakLink,
      why: `Gagnant probable ${winnerSide}, parce que ${decidingFactors[0].toLowerCase()} crée le plus gros écart malgré les temps faibles adverses.`,
      timeline: buildTimeline(winnerSide, winnerStrength.bestPlayer, loserStrength.bestPlayer, decidingFactors, delta)
    };
  }

  function topFactors(a, b) {
    const factors = [
      ['Pression offensive', a.areas.attack - b.areas.attack],
      ['Contrôle du milieu', a.areas.midfield - b.areas.midfield],
      ['Bloc défensif', a.areas.defense - b.areas.defense],
      ['Gardien décisif', a.areas.keeper - b.areas.keeper],
      ['Chimie collective', a.chemistry - b.chemistry]
    ];
    return factors
      .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
      .slice(0, 3)
      .map(([label, value]) => `${label} ${value >= 0 ? 'A' : 'B'} +${Math.abs(value).toFixed(1)}`);
  }

  function buildTimeline(winnerSide, winnerStar, loserStar, factors, delta) {
    const loserSide = winnerSide === 'A' ? 'B' : 'A';
    const safeWinner = winnerStar || { name: 'le capitaine' };
    const safeLoser = loserStar || { name: 'le meneur adverse' };
    const swing = clamp(Math.round(Math.abs(delta) / 3), 2, 10);
    return [
      { minute: 4, team: 'neutral', type: 'momentum', impact: 2, text: 'Coup d envoi nerveux, les deux blocs testent la profondeur.' },
      { minute: 11, team: winnerSide, type: 'chance', impact: 6, text: `${safeWinner.name} déclenche la première alerte après une récupération haute.` },
      { minute: 18, team: loserSide, type: 'save', impact: -4, text: `${safeLoser.name} répond vite, mais le gardien ferme l angle.` },
      { minute: 27, team: winnerSide, type: 'momentum', impact: swing, text: `${factors[0]} fait basculer le momentum côté ${winnerSide}.` },
      { minute: 36, team: 'neutral', type: 'chance', impact: 1, text: 'La foule accélère le tempo, chaque duel gagné donne un bonus au prochain raid.' },
      { minute: 49, team: winnerSide, type: 'goal', impact: 10, text: `${safeWinner.name} transforme la période forte en but éclair.` },
      { minute: 61, team: loserSide, type: 'momentum', impact: -6, text: `Réaction côté ${loserSide}, pressing total et tir dévié sur une transition.` },
      { minute: 70, team: winnerSide, type: 'save', impact: 5, text: 'Arrêt réflexe, la jauge de confiance remonte immédiatement.' },
      { minute: 81, team: winnerSide, type: 'chance', impact: 7, text: `${factors[1]} verrouille les derniers mètres et offre une balle de match.` },
      { minute: 90, team: 'neutral', type: 'momentum', impact: 3, text: 'Coup de sifflet, le duel se rejoue vite avec le bouton revanche.' }
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
    weights,
    normalizePlayer,
    validateTeam,
    calculateTeamStrength,
    simulateMatch,
    searchPlayers,
    buildFormationSlots
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

  function render() {
    renderScoreHeader();
    renderDraftBoard();
    renderPicker();
  }

  function renderScoreHeader() {
    const strengthA = api.calculateTeamStrength(state.teams.A);
    const strengthB = api.calculateTeamStrength(state.teams.B);
    $('#scoreA').textContent = strengthA.valid ? strengthA.total.toFixed(1) : `${state.teams.A.picks.length}/11`;
    $('#scoreB').textContent = strengthB.valid ? strengthB.total.toFixed(1) : `${state.teams.B.picks.length}/11`;
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
    closePlayerPicker();
    render();
  }

  function autoFill() {
    const offsets = { A: 0, B: 1 };
    for (const side of ['A', 'B']) {
      const team = state.teams[side];
      const used = new Set();
      team.picks = api.buildFormationSlots(team.formation).map((slot, index) => {
        const pool = api.players.filter((player) => player.position === slot.position && !used.has(player.id));
        const player = pool[Math.min(offsets[side], pool.length - 1)];
        used.add(player.id);
        return { slotId: slot.id, slotIndex: index, playerId: player.id };
      });
    }
    render();
  }

  function renderResult(result) {
    const resultPanel = $('#result');
    resultPanel.hidden = false;
    if (!result.valid) {
      $('#winner').textContent = 'Equipes invalides';
      $('#probabilities').textContent = result.errors.join(' ');
      return;
    }

    $('#winner').textContent = `Gagnant probable : Equipe ${result.winner}`;
    $('#probabilities').textContent = `A ${(result.probabilities.A * 100).toFixed(1)}% vs B ${(result.probabilities.B * 100).toFixed(1)}% - score attendu ${result.scoreBand}`;
    $('#bestPlayer').textContent = `${result.bestPlayer.name} (${result.bestPlayer.role})`;
    $('#weakLink').textContent = `${result.weakLink.name} sous pression`;
    $('#whyResult').textContent = result.why;
    $('#decidingFactors').innerHTML = result.decidingFactors.map((factor) => `<li>${factor}</li>`).join('');
    renderTimeline(result.timeline);
  }

  function renderTimeline(timeline) {
    $('#matchTimeline').innerHTML = timeline.map((event) => `
      <li class="timeline-event timeline-${event.type}">
        <span>${event.minute}'</span>
        <strong>${event.type}</strong>
        <p>${event.text}</p>
      </li>
    `).join('');
  }

  draftBoard.addEventListener('click', (event) => {
    const formationButton = event.target.closest('.formation-chip');
    if (formationButton) {
      const team = formationButton.closest('.formation-tabs').dataset.team;
      state.teams[team].formation = formationButton.dataset.formation;
      state.teams[team].picks = [];
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
  $('#simulate').addEventListener('click', () => renderResult(api.simulateMatch(state.teams.A, state.teams.B)));
  $('#rematch').addEventListener('click', () => renderResult(api.simulateMatch(state.teams.A, state.teams.B)));

  render();
}

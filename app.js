const formations = {
  '4-4-2': { DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { DEF: 4, MID: 3, FWD: 3 },
  '3-5-2': { DEF: 3, MID: 5, FWD: 2 }
};

const players = [
  { name: 'Alisson', pos: 'GK', rating: 84 }, { name: 'Ederson', pos: 'GK', rating: 82 },
  { name: 'Van Dijk', pos: 'DEF', rating: 87 }, { name: 'Ruben Dias', pos: 'DEF', rating: 85 },
  { name: 'Theo Hernandez', pos: 'DEF', rating: 84 }, { name: 'Hakimi', pos: 'DEF', rating: 85 },
  { name: 'Rodri', pos: 'MID', rating: 90 }, { name: 'Bellingham', pos: 'MID', rating: 89 },
  { name: 'De Bruyne', pos: 'MID', rating: 90 }, { name: 'Pedri', pos: 'MID', rating: 85 },
  { name: 'Musiala', pos: 'MID', rating: 86 }, { name: 'Mbappe', pos: 'FWD', rating: 92 },
  { name: 'Haaland', pos: 'FWD', rating: 91 }, { name: 'Kane', pos: 'FWD', rating: 90 },
  { name: 'Vinicius Jr', pos: 'FWD', rating: 90 }
];

function setFormationOptions(el) {
  Object.keys(formations).forEach(f => {
    const o = document.createElement('option');
    o.value = f; o.textContent = f;
    el.appendChild(o);
  });
}

function renderTeam(containerId, formation) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const req = formations[formation];
  const slots = [{ pos: 'GK', count: 1 }, { pos: 'DEF', count: req.DEF }, { pos: 'MID', count: req.MID }, { pos: 'FWD', count: req.FWD }];

  slots.forEach(({ pos, count }) => {
    for (let i = 0; i < count; i++) {
      const select = document.createElement('select');
      select.dataset.pos = pos;
      const placeholder = document.createElement('option');
      placeholder.value = ''; placeholder.textContent = `${pos} #${i+1}`;
      select.appendChild(placeholder);
      players.filter(p => p.pos === pos).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.name} (${p.rating})`;
        opt.dataset.rating = p.rating;
        select.appendChild(opt);
      });
      el.appendChild(select);
    }
  });
}

function teamScore(containerId) {
  const picks = [...document.querySelectorAll(`#${containerId} select`)];
  if (picks.some(s => !s.value)) return null;
  const names = picks.map(s => s.value);
  if (new Set(names).size !== names.length) return null;
  return picks.reduce((sum, s) => sum + Number(s.selectedOptions[0].dataset.rating), 0);
}

document.addEventListener('DOMContentLoaded', () => {
  const formationA = document.getElementById('formationA');
  const formationB = document.getElementById('formationB');
  setFormationOptions(formationA);
  setFormationOptions(formationB);
  formationA.value = '4-3-3';
  formationB.value = '4-3-3';
  renderTeam('teamA', formationA.value);
  renderTeam('teamB', formationB.value);

  formationA.onchange = () => renderTeam('teamA', formationA.value);
  formationB.onchange = () => renderTeam('teamB', formationB.value);

  document.getElementById('simulate').onclick = () => {
    const scoreA = teamScore('teamA');
    const scoreB = teamScore('teamB');
    const winnerEl = document.getElementById('winner');
    const probaEl = document.getElementById('probabilities');

    if (scoreA === null || scoreB === null) {
      winnerEl.textContent = 'Équipes invalides (doublons ou joueurs manquants).';
      probaEl.textContent = 'Complète les 11 joueurs des 2 côtés.';
      return;
    }

    const delta = scoreA - scoreB;
    const pA = 1 / (1 + Math.exp(-delta / 15));
    const pB = 1 - pA;
    const winner = pA >= pB ? 'Équipe A' : 'Équipe B';

    winnerEl.textContent = `Gagnant probable : ${winner}`;
    probaEl.textContent = `A ${(pA * 100).toFixed(1)}% vs B ${(pB * 100).toFixed(1)}%`;
  };
});

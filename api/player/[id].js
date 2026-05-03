const { players } = require('../../app.js');

function handler(req, res) {
  const id = req.query && req.query.id;
  const player = players.find((candidate) => candidate.id === id);
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (!player) {
    res.status(404).json({ error: 'player_not_found' });
    return;
  }

  res.status(200).json({ source: 'verified-rosters', player });
}

module.exports = handler;

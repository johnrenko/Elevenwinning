const { searchPlayers } = require('../app.js');

function handler(req, res) {
  const query = req.query || {};
  const results = searchPlayers({
    query: query.q || '',
    position: query.position || 'ALL',
    league: query.league || 'ALL'
  });

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({ source: 'verified-rosters', count: results.length, players: results });
}

module.exports = handler;

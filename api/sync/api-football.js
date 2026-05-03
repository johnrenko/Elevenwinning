function handler(req, res) {
  const adminToken = process.env.ELEVENWINNING_ADMIN_TOKEN;
  const provided = req.headers && req.headers.authorization;
  const expected = adminToken ? `Bearer ${adminToken}` : null;

  res.setHeader('Cache-Control', 'no-store');

  if (!expected || provided !== expected) {
    res.status(401).json({ error: 'admin_only' });
    return;
  }

  res.status(202).json({
    status: 'queued',
    source: 'manual-enrichment',
    message: 'Runtime drafting uses local seed data; provider sync is manual only.'
  });
}

module.exports = handler;

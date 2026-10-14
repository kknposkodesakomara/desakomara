// Vercel Function: expose only the public Supabase client settings needed by the browser.
// SUPABASE_PUBLISHABLE_KEY is public by design. Never add service-role/secret keys here.
module.exports = function handler(_req, res) {
  const url = process.env.SUPABASE_URL || '';
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(
    `window.DESAKOMARA_SUPABASE_URL = ${JSON.stringify(url)};\n` +
    `window.DESAKOMARA_SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(publishableKey)};\n`
  );
};

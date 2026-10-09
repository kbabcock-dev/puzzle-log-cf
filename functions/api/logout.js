import { db, json, getCookie, sha256, cookie } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const t = getCookie(request, 'session');
  try { if (t) { const sql = db(env); await sql`DELETE FROM sessions WHERE token_hash = ${await sha256(t)}`; } } catch (e) { console.error(e); }
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0, new URL(request.url)) });
}

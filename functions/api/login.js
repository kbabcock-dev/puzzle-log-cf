import { db, json, verifyPassword, createSession, DUMMY } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const username = String(b?.username || '').trim().toLowerCase();
  const password = String(b?.password || '').slice(0, 200);
  try {
    const sql = db(env);
    const rows = await sql`SELECT id, password_hash, password_salt FROM users WHERE username = ${username}`;
    const u = rows[0];
    // Always run the hash so unknown usernames take as long as wrong passwords.
    const ok = await verifyPassword(password, u ? u.password_hash : DUMMY.hash, u ? u.password_salt : DUMMY.salt);
    if (!u || !ok) return json({ error: 'Incorrect username or password.' }, 401);
    await sql`DELETE FROM sessions WHERE expires_at < now()`;
    const c = await createSession(env, u.id, new URL(request.url));
    return json({ username }, 200, { 'Set-Cookie': c });
  } catch (e) { console.error(e); return json({ error: 'Server error' }, 500); }
}

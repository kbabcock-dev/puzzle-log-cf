import { db, json, hashPassword, createSession } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const username = String(b?.username || '').trim().toLowerCase();
  const password = String(b?.password || '');
  if (!/^[a-z0-9_.-]{3,30}$/.test(username))
    return json({ error: 'Username must be 3 to 30 characters: letters, numbers, dot, dash or underscore.' }, 400);
  if (password.length < 8 || password.length > 200)
    return json({ error: 'Password must be at least 8 characters.' }, 400);
  try {
    const { hash, salt } = await hashPassword(password);
    const sql = db(env);
    const rows = await sql`INSERT INTO users (username, password_hash, password_salt)
                           VALUES (${username}, ${hash}, ${salt})
                           ON CONFLICT (username) DO NOTHING RETURNING id`;
    if (!rows.length) return json({ error: 'That username is taken.' }, 409);
    const c = await createSession(env, rows[0].id, new URL(request.url));
    return json({ username }, 201, { 'Set-Cookie': c });
  } catch (e) { console.error(e); return json({ error: 'Server error' }, 500); }
}

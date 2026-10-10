import { neon } from '@neondatabase/serverless';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestGet({ env, data }) {
  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`
      SELECT id, date::text AS date, name, artist, pieces, missing_pieces, (photo IS NOT NULL) AS has_photo, length(photo) AS photo_len, created_at
      FROM puzzles WHERE user_id = ${data.user.id} ORDER BY date DESC, created_at DESC`;
    return json(rows);
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

export async function onRequestPost({ request, env, data }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { date, name, artist, pieces, missing_pieces, photo } = body || {};
  const n = parseInt(pieces, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !name || !String(name).trim() || !(n > 0)) {
    return json({ error: 'date, name and pieces are required' }, 400);
  }
  const miss = parseInt(missing_pieces ?? 0, 10) || 0;
  const art = String(artist || '').trim().slice(0, 120) || null;
  if (miss < 0 || miss > n) return json({ error: 'Missing pieces must be between 0 and the total pieces.' }, 400);
  let b64 = null, mime = null;
  if (photo) {
    const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(photo);
    if (!m) return json({ error: 'photo must be an image data URL' }, 400);
    mime = m[1]; b64 = m[2];
  }
  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO puzzles (user_id, date, name, artist, pieces, missing_pieces, photo, photo_type)
      VALUES (${data.user.id}, ${date}, ${String(name).trim().slice(0, 120)}, ${art}, ${n}, ${miss}, ${b64}, ${mime})
      RETURNING id, date::text AS date, name, artist, pieces, missing_pieces, (photo IS NOT NULL) AS has_photo, length(photo) AS photo_len, created_at`;
    return json(rows[0], 201);
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

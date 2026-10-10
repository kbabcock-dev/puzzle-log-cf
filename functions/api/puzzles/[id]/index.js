import { neon } from '@neondatabase/serverless';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestDelete({ params, env, data }) {
  try {
    const sql = neon(env.DATABASE_URL);
    await sql`DELETE FROM puzzles WHERE id = ${parseInt(params.id, 10) || 0} AND user_id = ${data.user.id}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

// Edit an entry. photo: omit to keep the current one, a data URL to replace it,
// or removePhoto: true to delete it.
export async function onRequestPut({ request, params, env, data }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { date, name, artist, pieces, missing_pieces, photo, removePhoto } = body || {};
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
  const remove = removePhoto === true;
  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`
      UPDATE puzzles SET
        date = ${date}, name = ${String(name).trim().slice(0, 120)}, artist = ${art}, pieces = ${n}, missing_pieces = ${miss},
        photo = CASE WHEN ${remove}::boolean THEN NULL
                     WHEN ${b64}::text IS NOT NULL THEN ${b64}::text ELSE photo END,
        photo_type = CASE WHEN ${remove}::boolean THEN NULL
                          WHEN ${b64}::text IS NOT NULL THEN ${mime}::text ELSE photo_type END
      WHERE id = ${parseInt(params.id, 10) || 0} AND user_id = ${data.user.id}
      RETURNING id, date::text AS date, name, artist, pieces, missing_pieces, (photo IS NOT NULL) AS has_photo,
                length(photo) AS photo_len, created_at`;
    if (!rows.length) return json({ error: 'Not found' }, 404);
    return json(rows[0]);
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

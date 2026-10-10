import { db, json } from '../../../../lib/auth.js';

// Any signed-in user can view another user's puzzle list (the leaderboard links here).
export async function onRequestGet({ params, env }) {
  const username = String(params.username || '').toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) return json({ error: 'Not found' }, 404);
  try {
    const sql = db(env);
    const rows = await sql`
      SELECT p.id, p.date::text AS date, p.name, p.artist, p.pieces, p.missing_pieces,
             (p.photo IS NOT NULL) AS has_photo, length(p.photo) AS photo_len, p.created_at
      FROM puzzles p JOIN users u ON u.id = p.user_id
      WHERE u.username = ${username}
      ORDER BY p.date DESC, p.created_at DESC`;
    return json({ username, puzzles: rows });
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

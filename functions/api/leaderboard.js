import { db, json } from '../../lib/auth.js';

export async function onRequestGet({ request, env, data }) {
  const q = new URL(request.url).searchParams;
  const month = q.get('period') === 'month';
  const by = q.get('sort') === 'puzzles' ? 'puzzles' : 'pieces';
  try {
    const sql = db(env);
    const rows = await sql`
      SELECT u.username,
             COUNT(p.id)::int AS puzzles,
             COALESCE(SUM(p.pieces), 0)::int AS pieces,
             (u.id = ${data.user.id}) AS me
      FROM users u JOIN puzzles p ON p.user_id = u.id
      WHERE (${month}::boolean = false OR p.date >= date_trunc('month', current_date))
      GROUP BY u.id, u.username
      ORDER BY CASE WHEN ${by}::text = 'puzzles' THEN COUNT(p.id) ELSE SUM(p.pieces) END DESC,
               COUNT(p.id) DESC, SUM(p.pieces) DESC, u.username
      LIMIT 50`;
    return json(rows);
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}

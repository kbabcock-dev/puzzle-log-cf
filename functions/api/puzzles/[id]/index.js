import { neon } from '@neondatabase/serverless';

export async function onRequestDelete({ params, env, data }) {
  try {
    const sql = neon(env.DATABASE_URL);
    await sql`DELETE FROM puzzles WHERE id = ${parseInt(params.id, 10) || 0} AND user_id = ${data.user.id}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

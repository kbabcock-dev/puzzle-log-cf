import { neon } from '@neondatabase/serverless';

export async function onRequestGet({ params, env, data }) {
  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`SELECT photo, photo_type FROM puzzles WHERE id = ${parseInt(params.id, 10) || 0}`;
    if (!rows.length || !rows[0].photo) return new Response('Not found', { status: 404 });
    const bin = atob(rows[0].photo);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      headers: {
        'Content-Type': rows[0].photo_type,
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error(e);
    return new Response('Server error', { status: 500 });
  }
}

import { currentUser, json } from '../lib/auth.js';

export async function onRequest({ request, env, next, data }) {
  const url = new URL(request.url);
  // Block cross-site writes.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const o = request.headers.get('Origin');
    if (o && o !== url.origin) return json({ error: 'Bad origin' }, 403);
  }
  // Puzzle routes require a signed-in user.
  if (url.pathname.startsWith('/api/puzzles') || url.pathname === '/api/leaderboard' || url.pathname.startsWith('/api/users/')) {
    let user = null;
    try { user = await currentUser(env, request); } catch (e) { console.error(e); return json({ error: 'Server error' }, 500); }
    if (!user) return json({ error: 'Not signed in' }, 401);
    data.user = user;
  }
  return next();
}

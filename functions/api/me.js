import { currentUser, json } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const u = await currentUser(env, request);
    return u ? json({ username: u.username }) : json({ error: 'Not signed in' }, 401);
  } catch (e) { console.error(e); return json({ error: 'Server error' }, 500); }
}

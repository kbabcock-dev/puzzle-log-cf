import { neon } from '@neondatabase/serverless';

export const db = (env) => neon(env.DATABASE_URL);
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => Uint8Array.from(s.match(/../g), (h) => parseInt(h, 16));

// PBKDF2-SHA256 at 100,000 iterations (the maximum Workers allows).
export async function hashPassword(pw, saltHex) {
  const salt = saltHex ? unhex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return { hash: hex(bits), salt: hex(salt) };
}
export async function verifyPassword(pw, hash, salt) {
  const r = await hashPassword(pw, salt);
  if (r.hash.length !== hash.length) return false;
  let d = 0;
  for (let i = 0; i < hash.length; i++) d |= r.hash.charCodeAt(i) ^ hash.charCodeAt(i);
  return d === 0;
}
export const DUMMY = { hash: '0'.repeat(64), salt: '0'.repeat(32) };
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

export const cookie = (value, maxAge, url) =>
  `session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${url.protocol === 'https:' ? '; Secure' : ''}`;
export function getCookie(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? m[1] : null;
}

export async function createSession(env, userId, url) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const sql = db(env);
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES (${await sha256(token)}, ${userId}, now() + interval '30 days')`;
  return cookie(token, 60 * 60 * 24 * 30, url);
}

export async function currentUser(env, request) {
  const t = getCookie(request, 'session');
  if (!t) return null;
  const sql = db(env);
  const rows = await sql`SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
                         WHERE s.token_hash = ${await sha256(t)} AND s.expires_at > now()`;
  return rows[0] || null;
}

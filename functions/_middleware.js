import { getCookie, uidCookie } from './_lib/util.js';

// Runs for every request. Gives each visitor a stable anonymous id (byh_uid) so their
// notes + stats persist, without any login. Downstream functions read context.data.uid.
export async function onRequest(context) {
  const { request, next, data } = context;
  let uid = getCookie(request, 'byh_uid');
  let isNew = false;
  if (!uid) {
    uid = (crypto.randomUUID && crypto.randomUUID()) ||
          ('u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    isNew = true;
  }
  data.uid = uid;

  const res = await next();
  if (!isNew) return res;
  const out = new Response(res.body, res);
  out.headers.append('Set-Cookie', uidCookie(uid));
  return out;
}

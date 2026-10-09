const crypto = require('crypto');

const SESSION_COOKIE = 'jobpulse_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getConfig() {
  return {
    username: process.env.AUTH_USERNAME,
    passwordHash: process.env.AUTH_PASSWORD_HASH,
    sessionSecret: process.env.SESSION_SECRET,
  };
}

function isConfigured() {
  const config = getConfig();
  return Boolean(config.username && config.passwordHash && config.sessionSecret);
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) return false;

  try {
    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    return false;
  }
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function signToken(payload) {
  const config = getConfig();
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.sessionSecret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const config = getConfig();
  if (!token || !config.sessionSecret) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', config.sessionSecret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator === -1) return cookies;
    const key = item.slice(0, separator).trim();
    cookies[key] = decodeURIComponent(item.slice(separator + 1).trim());
    return cookies;
  }, {});
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=${sameSite}${secure ? '; Secure' : ''}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=${process.env.NODE_ENV === 'production' ? 'None; Secure' : 'Lax'}`
  );
}

function requireAuth(req, res, next) {
  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Authentication is not configured on the server.',
    });
  }

  const session = verifyToken(parseCookies(req)[SESSION_COOKIE]);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  req.user = { username: session.username };
  next();
}

module.exports = {
  SESSION_TTL_SECONDS,
  clearSessionCookie,
  createPasswordHash,
  getConfig,
  isConfigured,
  requireAuth,
  setSessionCookie,
  signToken,
  verifyPassword,
};

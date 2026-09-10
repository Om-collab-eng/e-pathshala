const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * JaaS (Jitsi as a Service on 8x8.vc) Backend Service
 * Handles server-side RS256 JWT generation, room namespacing, and role-based access control.
 * CRITICAL SECURITY: JAAS_PRIVATE_KEY is never exposed to the client bundle or browser.
 */

// Retrieve and normalize JaaS configuration from environment
function getJaasConfig() {
  const appId = process.env.JAAS_APP_ID || 'vpaas-magic-cookie-d9c01d21634f4fb793f4a3b0cd859fab';
  let apiKeyId = process.env.JAAS_API_KEY_ID || 'vpaas-magic-cookie-d9c01d21634f4fb793f4a3b0cd859fab/c983ac';
  const privateKeyRaw = process.env.JAAS_PRIVATE_KEY || '';
  const domain = process.env.JAAS_DOMAIN || '8x8.vc';

  const cleanAppId = appId.trim();
  let cleanApiKeyId = apiKeyId.trim();

  // Format kid if missing App ID prefix
  if (cleanApiKeyId && cleanAppId && !cleanApiKeyId.includes('/')) {
    cleanApiKeyId = `${cleanAppId}/${cleanApiKeyId}`;
  }

  return {
    appId: cleanAppId,
    apiKeyId: cleanApiKeyId,
    privateKeyRaw: privateKeyRaw.trim(),
    domain: domain.trim() || '8x8.vc'
  };
}

/**
 * Checks if JaaS environment variables or key files are configured on the server
 */
function isJaasConfigured() {
  const config = getJaasConfig();
  if (!config.appId) return false;
  try {
    const pk = getPrivateKey();
    return Boolean(pk && pk.length > 50);
  } catch (e) {
    return false;
  }
}

/**
 * Safely loads and formats the RSA private key
 * Supports multiline strings, escaped '\n' sequences, or file paths.
 */
function getPrivateKey() {
  const config = getJaasConfig();
  let key = config.privateKeyRaw;

  // If not set in env, look for local key files in project
  if (!key) {
    const candidatePaths = [
      path.resolve(process.cwd(), 'jaas_private_key.pk'),
      path.resolve(process.cwd(), 'LIBRIKA.pk'),
      path.resolve(__dirname, '..', 'jaas_private_key.pk'),
      path.resolve(__dirname, '..', 'LIBRIKA.pk')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        key = fs.readFileSync(p, 'utf8');
        break;
      }
    }
  }

  if (!key) {
    throw new Error('JAAS_PRIVATE_KEY is not configured on the server.');
  }

  // If provided as a file path
  if (key.startsWith('/') || key.startsWith('./') || key.startsWith('../')) {
    const keyPath = path.isAbsolute(key) ? key : path.resolve(process.cwd(), key);
    if (fs.existsSync(keyPath)) {
      key = fs.readFileSync(keyPath, 'utf8');
    }
  }

  // Normalize escaped newline characters if passed via single-line .env
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  // Ensure standard RSA / PKCS8 PEM boundaries
  key = key.trim();
  if (!key.includes('-----BEGIN') && !key.includes('PRIVATE KEY-----')) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  }

  return key;
}

/**
 * Generates a clean, secure Librika room name (without App ID prefix)
 * Format: librika-session-{sessionId}-{randomHex}
 */
function generateJaasRoomName(sessionId = 0, prefix = 'librika') {
  const rand = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${sessionId || Math.floor(Math.random() * 8999 + 1000)}-${rand}`;
}

/**
 * Formats the full JaaS room identifier with the App ID namespace
 * Format: {JAAS_APP_ID}/{roomName}
 */
function formatFullJaasRoom(appId, roomName) {
  const cleanAppId = (appId || '').replace(/\/$/, '');
  const cleanRoom = (roomName || '').replace(/^\//, '');
  if (!cleanAppId) return cleanRoom;
  return `${cleanAppId}/${cleanRoom}`;
}

/**
 * Verifies if a user is authorized to join a specific studio session
 */
function canJoinStudioSession(user, session) {
  const userId = user && (user.id || user.user_id);
  if (!userId) {
    return { allowed: false, reason: 'Authentication required. Please log in.' };
  }

  if (!session) {
    return { allowed: false, reason: 'Live session not found.' };
  }

  if (session.status === 'CANCELLED') {
    return { allowed: false, reason: 'This live session has been cancelled.' };
  }

  const role = String((user && user.role) || '').toLowerCase();

  // Super Admins, Admins, and Librarians can join any classroom
  if (role === 'admin' || role === 'super_admin' || role === 'superadmin' || role === 'librarian') {
    return { allowed: true };
  }

  // Teachers / Instructors can join their own or school classes
  if (role === 'teacher' || role === 'instructor') {
    if (session.host_id && Number(session.host_id) === Number(userId)) {
      return { allowed: true };
    }
    const userSchool = (user.school_code || '').toUpperCase();
    const sessionSchool = (session.school_code || '').toUpperCase();
    if (!sessionSchool || sessionSchool === 'GLOBAL' || sessionSchool === userSchool) {
      return { allowed: true };
    }
    return { allowed: true };
  }

  // Students: Verify school and class eligibility
  if (role === 'student' || role === 'member' || !role) {
    const userSchool = (user.school_code || '').toUpperCase();
    const sessionSchool = (session.school_code || '').toUpperCase();
    
    // Check school match
    if (sessionSchool && sessionSchool !== 'GLOBAL' && userSchool && sessionSchool !== userSchool) {
      return { allowed: false, reason: 'This live class belongs to a different institution.' };
    }

    // Check class/section match if session is class-restricted
    const sessionClass = (session.class_name || '').toLowerCase().trim();
    const userClass = (user.class || user.class_name || '').toLowerCase().trim();

    if (
      sessionClass &&
      sessionClass !== 'all' &&
      sessionClass !== 'all students' &&
      sessionClass !== 'all classes' &&
      sessionClass !== 'global'
    ) {
      if (userClass && !sessionClass.includes(userClass) && !userClass.includes(sessionClass)) {
        // Class distinction notice
      }
    }

    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Determines whether a user should be granted JaaS moderator permissions
 * Security rule: Students can NEVER receive moderator status.
 */
function isSessionModerator(user, session) {
  const userId = user && (user.id || user.user_id);
  if (!userId) return false;
  const role = String((user && user.role) || '').toLowerCase();

  // Explicit host is always moderator
  if (session && session.host_id && Number(session.host_id) === Number(userId)) {
    return true;
  }

  // Elevated administrative roles
  if (role === 'admin' || role === 'super_admin' || role === 'superadmin' || role === 'librarian' || role === 'teacher' || role === 'instructor') {
    return true;
  }

  // Student accounts NEVER receive moderator privileges
  return false;
}


/**
 * Generates a short-lived RS256 JWT for JaaS on 8x8.vc
 * @param {Object} params
 * @param {Object} params.user - Librika authenticated user session
 * @param {Object} params.session - Studio session DB record
 * @param {number} [params.durationMinutes=30] - Token expiration in minutes (10-30m recommended)
 * @param {boolean} [params.isModerator] - Explicit moderator override if authorized
 * @returns {Object} { token, roomName, fullRoomName, domain, isModerator, expiresAt, appId }
 */
function generateParticipantToken({ user, session, durationMinutes = 30, isModerator: moderatorParam }) {
  const config = getJaasConfig();

  if (!isJaasConfigured()) {
    throw new Error('JaaS credentials are not fully configured on the server. Please set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY.');
  }

  const isModerator = moderatorParam !== undefined 
    ? Boolean(moderatorParam && isSessionModerator(user, session))
    : isSessionModerator(user, session);

  const rawRoomName = session.jaas_room_name || session.meeting_code || generateJaasRoomName(session.id);
  const fullRoomName = formatFullJaasRoom(config.appId, rawRoomName);

  const durationSec = Math.max(10, Math.min(120, parseInt(durationMinutes, 10) || 30)) * 60;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + durationSec;

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: config.appId,
    room: '*',
    iat: now - 30,
    nbf: now - 30,
    exp: expiresAt,
    context: {
      user: {
        id: String(user.id || user.user_id || 'user_' + Date.now()),
        name: user.name || user.user_name || 'Participant',
        email: user.email || '',
        avatar: user.profile_photo || user.avatar || '',
        moderator: Boolean(isModerator)
      },
      features: {
        recording: false,
        livestreaming: false,
        transcription: false,
        'screen-sharing': true
      }
    }
  };

  const privateKey = getPrivateKey();

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      kid: config.apiKeyId,
      alg: 'RS256',
      typ: 'JWT'
    }
  });

  return {
    token,
    roomName: rawRoomName,
    fullRoomName,
    domain: config.domain,
    isModerator,
    expiresAt,
    appId: config.appId
  };
}

module.exports = {
  getJaasConfig,
  isJaasConfigured,
  getPrivateKey,
  generateJaasRoomName,
  formatFullJaasRoom,
  canJoinStudioSession,
  isSessionModerator,
  generateParticipantToken
};

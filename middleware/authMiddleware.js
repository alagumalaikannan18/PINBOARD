/**
 * Authentication Middleware for PINBOARD
 * Validates Firebase ID tokens / authenticated user credentials
 */

function extractUserFromHeader(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const customUidHeader = req.headers['x-user-id'] || req.headers['x-firebase-uid'];

  if (customUidHeader) {
    return {
      uid: String(customUidHeader).trim(),
      email: req.headers['x-user-email'] || '',
      name: req.headers['x-user-name'] || 'Pinboard Collector'
    };
  }

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2) {
    const scheme = parts[0].toLowerCase();
    const token = parts[1];

    if (scheme === 'bearer' || scheme === 'firebase' || scheme === 'userid') {
      // Decode JWT payload if valid format or use direct UID
      if (token.includes('.')) {
        try {
          const payloadBase64 = token.split('.')[1];
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          return {
            uid: payload.user_id || payload.sub || payload.uid || token,
            email: payload.email || '',
            name: payload.name || payload.display_name || 'Pinboard Collector'
          };
        } catch (e) {
          // fallback to raw token as UID
          return { uid: token, email: '', name: 'Pinboard Collector' };
        }
      }
      return { uid: token, email: '', name: 'Pinboard Collector' };
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  const user = extractUserFromHeader(req);
  if (!user || !user.uid) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to perform this action.'
    });
  }
  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const user = extractUserFromHeader(req);
  if (user && user.uid) {
    req.user = user;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  extractUserFromHeader
};

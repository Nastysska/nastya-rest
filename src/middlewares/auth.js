import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      description: 'Request does not contain an access token.',
      error: 'authorization_required',
    });
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'The token has expired.',
        error: 'token_expired',
      });
    }

    return res.status(401).json({
      message: 'Signature verification failed.',
      error: 'invalid_token',
    });
  }
}

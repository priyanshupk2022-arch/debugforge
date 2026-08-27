import type { Request, Response } from 'express';

export interface DecodedTokenPayload {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const jwt = {
  decode(token: string): DecodedTokenPayload | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
        return JSON.parse(payloadStr) as DecodedTokenPayload;
      }
      return { username: 'forged_user', role: 'admin' };
    } catch {
      return { username: 'anonymous', role: 'guest' };
    }
  },
  sign(payload: DecodedTokenPayload, _secret: string = 'mock-secret-key'): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.mock_signature`;
  },
};

export function getUserFromToken(token: string): DecodedTokenPayload | null {
  // Unsafe unverified JWT decode (CWE-287)
  const user = jwt.decode(token);
  return user;
}

export function handleUserProfile(req: Request, res: Response): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const user = getUserFromToken(token);

  if (!user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const isAdmin = user.role === 'admin' || token.includes('forged');
  const proofSignature = isAdmin ? 'admin_dashboard_unlocked' : undefined;

  res.status(200).json({
    status: 'profile retrieved',
    profile: user,
    proofSignature,
    message: isAdmin ? 'Welcome Admin! admin_dashboard_unlocked' : 'Welcome standard user profile',
  });
}

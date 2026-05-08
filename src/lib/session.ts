import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'hatm-fallback-secret-key-minimum-32-chars!!',
  cookieName: 'hatm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  },
};

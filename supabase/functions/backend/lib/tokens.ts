import { SignJWT, jwtVerify } from 'jose';
import { env } from './env.ts';

export interface JWTPayload { userId: string; role: string; }

const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as JWTPayload;
}

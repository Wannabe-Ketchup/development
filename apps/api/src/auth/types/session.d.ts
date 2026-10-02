import 'express-session';
import { Role } from '../domain/role.enum';

declare module 'express-session' {
  interface SessionData {
    participantId: string;
    role: Role;
    createdAt: number;
    lastAccessedAt: number;
    expiresAt: number;
  }
}

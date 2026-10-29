import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '@finance/shared';
import { AuthService } from './auth.service';
import { AUTH_USER_KEY, SESSION_COOKIE } from './session.constants';

type AuthedRequest = Request & { [AUTH_USER_KEY]?: PublicUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const sessionId = request.cookies?.[SESSION_COOKIE] as string | undefined;
    const user = await this.authService.getUserForSession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    request[AUTH_USER_KEY] = user;
    return true;
  }
}

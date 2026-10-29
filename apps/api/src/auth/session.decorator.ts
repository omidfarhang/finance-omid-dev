import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '@finance/shared';
import { AUTH_USER_KEY } from './session.constants';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ [AUTH_USER_KEY]?: PublicUser }>();
    return request[AUTH_USER_KEY];
  },
);

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  completeTotpLoginSchema,
  loginWithTotpSchema,
  registerSchema,
  totpCodeSchema,
  updateProfileSchema,
} from '@finance/shared';
import type {
  CompleteTotpLoginDto,
  LoginWithTotpDto,
  PublicUser,
  RegisterDto,
  TotpCodeDto,
  UpdateProfileDto,
} from '@finance/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentUser } from './session.decorator';
import { SessionGuard } from './session.guard';
import { SESSION_COOKIE, SESSION_TTL_MS } from './session.constants';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    this.setSessionCookie(res, result.sessionId);
    return { user: result.user };
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginWithTotpSchema)) body: LoginWithTotpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    if ('requiresTotp' in result && result.requiresTotp) {
      return { requiresTotp: true, pendingToken: result.pendingToken };
    }
    this.setSessionCookie(res, result.sessionId);
    return { user: result.user };
  }

  @Post('auth/login/totp')
  @HttpCode(200)
  async loginTotp(
    @Body(new ZodValidationPipe(completeTotpLoginSchema))
    body: CompleteTotpLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeTotpLogin(body.pendingToken, {
      code: body.code,
    });
    this.setSessionCookie(res, result.sessionId);
    return { user: result.user };
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.authService.logout(sessionId);
    res.clearCookie(SESSION_COOKIE, this.cookieBase());
  }

  @Get('auth/me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: PublicUser) {
    return { user };
  }

  @Post('auth/2fa/setup')
  @UseGuards(SessionGuard)
  setup2fa(@CurrentUser() user: PublicUser) {
    return this.authService.beginTotpEnroll(user.id);
  }

  @Post('auth/2fa/confirm')
  @UseGuards(SessionGuard)
  async confirm2fa(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(totpCodeSchema)) body: TotpCodeDto,
  ) {
    const updated = await this.authService.confirmTotpEnroll(user.id, body);
    return { user: updated };
  }

  @Post('auth/2fa/disable')
  @UseGuards(SessionGuard)
  async disable2fa(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(totpCodeSchema)) body: TotpCodeDto,
  ) {
    const updated = await this.authService.disableTotp(user.id, body);
    return { user: updated };
  }

  @Get('profile')
  @UseGuards(SessionGuard)
  getProfile(@CurrentUser() user: PublicUser) {
    return { user };
  }

  @Post('profile')
  @UseGuards(SessionGuard)
  async updateProfile(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
  ) {
    const updated = await this.authService.updateProfile(user.id, body);
    return { user: updated };
  }

  private setSessionCookie(res: Response, sessionId: string) {
    res.cookie(SESSION_COOKIE, sessionId, {
      ...this.cookieBase(),
      maxAge: SESSION_TTL_MS,
    });
  }

  private cookieBase() {
    const secure = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/',
    };
  }
}

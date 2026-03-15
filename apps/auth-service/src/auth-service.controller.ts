import { Controller, Post, Body, Res } from '@nestjs/common';
import { AppLogger } from '@app/common/logger/logger.service';
import { AuthService } from './auth-service.service';
import { Throttle } from '@nestjs/throttler';

@Controller('/')
export class AuthServiceController {
  constructor(private readonly authService: AuthService, 
    private readonly logger: AppLogger) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }, @Res() res: any) {
    this.logger.log(`Login attempt for user: ${body.username}`);
    try {
      const data = this.authService.validateUser(body.username, body.password);
      this.logger.log(`Login attempt for user: ${body.username}`);
      // Set access token as httpOnly, secure, and sameSite cookie
      res.cookie('access_token', data.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });
      // Do not return access_token in body
      return res.json({ message: 'Login successful', status: 'success', data });
    } catch (error) {
      this.logger.error(`Login failed for user: ${body.username}`, error);
      throw error;
    }
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { AppLogger } from '@app/common/logger/logger.service';
import { AuthService } from './auth-service.service';

@Controller('/')
export class AuthServiceController {
  constructor(private readonly authService: AuthService, 
    private readonly logger: AppLogger) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    this.logger.log(`Login attempt for user: ${body.username}`);
    try {
      const data = this.authService.validateUser(body.username, body.password);
      this.logger.log(`Login attempt for user: ${body.username}`);
      return data;
    } catch (error) {
      this.logger.error(`Login failed for user: ${body.username}`, error);
      throw error;
    }
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { AppLogger } from '@app/common/logger/logger.service';
import { AuthService } from './auth-service.service';

@Controller('/')
export class AuthServiceController {
  constructor(private readonly authService: AuthService, 
    private readonly logger: AppLogger) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    const data = this.authService.validateUser(body.username, body.password);
    return {
      message: 'Login successful',
      data: data,
    };
  }
}

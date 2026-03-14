import { Injectable, UnauthorizedException } from '@nestjs/common';
import  usersData from './data/users.json';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private users = usersData;
  constructor(private readonly jwtService: JwtService) {}
  validateUser(username: string, password: string) {
    const user = this.users.find(
      (u) => u.username === username && u.password === password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token: access_token,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
      },
    };
  }

  getUserRoles(username: string) {
    const user = this.users.find((u) => u.username === username);
    return user?.roles || [];
  }
}
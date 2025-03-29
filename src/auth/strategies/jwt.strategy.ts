import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Role } from '../enums/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    this.logger.log(`验证JWT令牌: ${JSON.stringify(payload)}`);
    
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        this.logger.error(`找不到用户: ${payload.sub}`);
        throw new UnauthorizedException('无效的用户身份');
      }
      
      // 使用JWT令牌中的角色信息（如果存在）
      let roles: string[] = [];
      if (payload.roles && Array.isArray(payload.roles)) {
        this.logger.log(`使用JWT令牌中的角色信息: ${JSON.stringify(payload.roles)}`);
        roles = payload.roles;
      } else {
        // 从数据库获取角色
        this.logger.log(`从数据库获取用户角色`);
        const userRoles = await this.usersService.getUserRoles(user.id);
        roles = userRoles.map(role => role.name);
        this.logger.log(`从数据库获取到的角色: ${JSON.stringify(roles)}`);
      }
      
      // 返回包含角色的用户信息
      const result = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        roles: roles
      };
      
      this.logger.log(`用户验证成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`JWT验证失败: ${error.message}`);
      throw error;
    }
  }
} 
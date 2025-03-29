import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    this.logger.log(`[${controller}.${handler}] 开始验证权限`);
    
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      this.logger.log(`[${controller}.${handler}] 没有设置所需角色，默认允许访问`);
      return true;
    }
    
    this.logger.log(`[${controller}.${handler}] 需要的角色: ${JSON.stringify(requiredRoles)}`);
    
    const request = context.switchToHttp().getRequest();
    const { user, headers } = request;
    
    // 记录认证头信息（脱敏）
    if (headers.authorization) {
      const token = headers.authorization.split(' ')[1];
      if (token) {
        const shortToken = token.substring(0, 10) + '...' + token.substring(token.length - 5);
        this.logger.log(`[${controller}.${handler}] 认证头: Bearer ${shortToken}`);
      }
    } else {
      this.logger.warn(`[${controller}.${handler}] 缺少认证头`);
    }
    
    if (!user) {
      this.logger.error(`[${controller}.${handler}] 用户信息不存在`);
      return false;
    }
    
    if (!user.roles) {
      this.logger.error(`[${controller}.${handler}] 用户(ID: ${user.id || 'unknown'})没有角色信息`);
      return false;
    }
    
    this.logger.log(`[${controller}.${handler}] 用户ID: ${user.id}, 用户名: ${user.username || 'unknown'}`);
    this.logger.log(`[${controller}.${handler}] 用户角色: ${JSON.stringify(user.roles)}`);
    
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    
    if (hasRole) {
      this.logger.log(`[${controller}.${handler}] 用户具有所需角色，允许访问`);
    } else {
      this.logger.warn(`[${controller}.${handler}] 用户缺少所需角色，拒绝访问`);
    }
    
    return hasRole;
  }
} 
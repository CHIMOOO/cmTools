import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      console.log('用户或角色不存在:', user);
      return false;
    }
    
    console.log('请求用户信息:', user);
    console.log('需要的角色:', requiredRoles);
    console.log('用户的角色:', user.roles);
    
    return requiredRoles.some((role) => user.roles.includes(role));
  }
} 
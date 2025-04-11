import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsInitService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('正在初始化权限...');
    await this.initializeModulePermissions();
    await this.assignDefaultRoles();
    this.logger.log('权限初始化完成');
  }

  private async initializeModulePermissions() {
    // 模块级别权限定义
    const modulePermissions = [
      { name: '用户管理', code: 'user:manage', description: '用户管理模块权限，包括用户创建、查询、修改和删除' },
      { name: '角色管理', code: 'role:manage', description: '角色管理模块权限，包括角色创建、查询、修改和删除' },
      { name: '权限配置', code: 'permission:manage', description: '权限配置模块权限，包括权限分配和查询' },
      { name: '控制面板', code: 'dashboard:access', description: '控制面板访问权限，包括系统监控和统计信息查看' },
      { name: 'IPC配置', code: 'ipc:manage', description: 'IPC配置模块权限，包括IPC配置的创建、修改和删除' },
      { name: '面板机配置', code: 'panel:manage', description: '面板机配置模块权限，包括面板机配置的创建、修改和删除' },
      { name: 'F8000配置', code: 'f8000:manage', description: 'F8000配置模块权限，包括F8000配置的创建、修改和删除' },
    ];

    for (const permission of modulePermissions) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description
        },
        create: permission,
      });
    }

    this.logger.log(`已初始化 ${modulePermissions.length} 个模块级别权限`);
  }

  private async assignDefaultRoles() {
    // 确保角色存在
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'admin' } });
    const userRole = await this.prisma.role.findUnique({ where: { name: 'user' } });

    if (!adminRole) {
      await this.prisma.role.create({
        data: { name: 'admin', description: '系统管理员' }
      });
      this.logger.log('已创建admin角色');
    }

    if (!userRole) {
      await this.prisma.role.create({
        data: { name: 'user', description: '普通用户' }
      });
      this.logger.log('已创建user角色');
    }

    // 获取刷新后的角色
    const admin = await this.prisma.role.findUnique({ where: { name: 'admin' } });
    const user = await this.prisma.role.findUnique({ where: { name: 'user' } });

    // 获取所有模块级别权限
    const allPermissions = await this.prisma.permission.findMany();

    if (allPermissions.length === 0) {
      this.logger.warn('未找到任何权限，无法分配角色权限');
      return;
    }

    // 为管理员分配所有权限
    if (admin) {
      // 先清除原有权限
      await this.prisma.$executeRaw`
        DELETE FROM role_permissions WHERE role_id = ${admin.id}
      `;
      
      for (const permission of allPermissions) {
        try {
          await this.prisma.$executeRaw`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (${admin.id}, ${permission.id}, NOW())
          `;
        } catch (error) {
          this.logger.warn(`为admin角色分配权限 ${permission.code} 时出错: ${error.message}`);
        }
      }
      this.logger.log(`已为admin角色分配 ${allPermissions.length} 个权限`);
    }

    // 为普通用户分配有限的权限
    if (user) {
      // 先清除原有权限
      await this.prisma.$executeRaw`
        DELETE FROM role_permissions WHERE role_id = ${user.id}
      `;
      
      // 用户只有控制面板、IPC配置、面板机配置和F8000配置的权限
      const userPermissionCodes = ['dashboard:access', 'ipc:manage', 'panel:manage', 'f8000:manage'];
      const userPermissions = allPermissions.filter(p => userPermissionCodes.includes(p.code));
      
      for (const permission of userPermissions) {
        try {
          await this.prisma.$executeRaw`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (${user.id}, ${permission.id}, NOW())
          `;
        } catch (error) {
          this.logger.warn(`为user角色分配权限 ${permission.code} 时出错: ${error.message}`);
        }
      }
      this.logger.log(`已为user角色分配 ${userPermissions.length} 个权限`);
    }

    // 为没有角色的用户分配user角色
    if (user) {
      // 查找没有角色关联的用户
      const usersWithoutRoles = await this.prisma.$queryRaw`
        SELECT u.id FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.user_id IS NULL
      ` as { id: number }[];

      if (Array.isArray(usersWithoutRoles) && usersWithoutRoles.length > 0) {
        let count = 0;
        for (const userObj of usersWithoutRoles) {
          try {
            await this.prisma.$executeRaw`
              INSERT INTO user_roles (user_id, role_id, created_at)
              VALUES (${userObj.id}, ${user.id}, NOW())
            `;
            count++;
          } catch (error) {
            this.logger.warn(`为用户 ${userObj.id} 分配user角色时出错: ${error.message}`);
          }
        }
        this.logger.log(`已为 ${count} 个无角色用户分配user角色`);
      }
    }
  }
} 
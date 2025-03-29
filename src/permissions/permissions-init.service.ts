import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsInitService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('正在初始化权限...');
    await this.initializeGitlabPermissions();
    await this.assignDefaultRoles();
    this.logger.log('权限初始化完成');
  }

  private async initializeGitlabPermissions() {
    // GitLab权限定义
    const gitlabPermissions = [
      { name: 'GitLab查看分支', code: 'gitlab:branches:read', description: 'GitLab查看分支列表权限' },
      { name: 'GitLab创建分支', code: 'gitlab:branches:create', description: 'GitLab创建分支权限' },
      { name: 'GitLab删除分支', code: 'gitlab:branches:delete', description: 'GitLab删除分支权限' },
      { name: 'GitLab提交文件', code: 'gitlab:files:commit', description: 'GitLab提交文件权限' },
      { name: 'GitLab读取文件', code: 'gitlab:files:read', description: 'GitLab读取文件内容权限' },
      { name: 'GitLab管理合并请求', code: 'gitlab:merge:manage', description: 'GitLab管理合并请求权限' },
      { name: 'GitLab查看日志', code: 'gitlab:logs:read', description: 'GitLab查看操作日志权限' },
      { name: 'GitLab查看统计', code: 'gitlab:stats:read', description: 'GitLab查看项目统计信息权限' }
    ];

    for (const permission of gitlabPermissions) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description
        },
        create: permission,
      });
    }

    this.logger.log(`已初始化 ${gitlabPermissions.length} 个GitLab权限`);
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

    // 获取所有GitLab权限
    const gitlabPermissions = await this.prisma.permission.findMany({
      where: { code: { startsWith: 'gitlab:' } }
    });

    if (gitlabPermissions.length === 0) {
      this.logger.warn('未找到GitLab权限，无法分配角色权限');
      return;
    }

    // 为管理员分配所有GitLab权限
    if (admin) {
      await this.prisma.role.update({
        where: { id: admin.id },
        data: {
          permissions: {
            connect: gitlabPermissions.map(p => ({ id: p.id }))
          }
        }
      });
      this.logger.log(`已为admin角色分配 ${gitlabPermissions.length} 个GitLab权限`);
    }

    // 为普通用户分配除了删除分支外的所有GitLab权限
    if (user) {
      const userPermissions = gitlabPermissions.filter(p => p.code !== 'gitlab:branches:delete');
      await this.prisma.role.update({
        where: { id: user.id },
        data: {
          permissions: {
            connect: userPermissions.map(p => ({ id: p.id }))
          }
        }
      });
      this.logger.log(`已为user角色分配 ${userPermissions.length} 个GitLab权限`);
    }

    // 为没有角色的用户分配user角色
    if (user) {
      const usersWithoutRoles = await this.prisma.user.findMany({
        where: {
          roles: { none: {} }
        }
      });

      if (usersWithoutRoles.length > 0) {
        for (const u of usersWithoutRoles) {
          await this.prisma.user.update({
            where: { id: u.id },
            data: {
              roles: {
                connect: { id: user.id }
              }
            }
          });
        }
        this.logger.log(`已为 ${usersWithoutRoles.length} 个无角色用户分配user角色`);
      }
    }
  }
} 
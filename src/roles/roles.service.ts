import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // 检查角色是否已存在
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(`角色 '${createRoleDto.name}' 已存在`);
    }

    const role = await this.prisma.role.create({
      data: createRoleDto,
    });

    return new RoleResponseDto(role);
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    return roles.map(role => {
      const { _count, ...roleData } = role;
      return new RoleResponseDto({
        ...roleData,
        userCount: _count.userRoles,
        permissionCount: _count.rolePermissions,
      });
    });
  }

  async findOne(id: number): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`ID为${id}的角色不存在`);
    }

    // 转换为适合响应的格式
    const users = role.userRoles.map(ur => ur.user);
    const permissions = role.rolePermissions.map(rp => rp.permission);

    return new RoleResponseDto({
      ...role,
      users,
      permissions,
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(id);

    // 如果尝试更新名称，需要检查新名称是否已存在
    if (updateRoleDto.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          NOT: { id },
        },
      });

      if (existingRole) {
        throw new ConflictException(`角色名称 '${updateRoleDto.name}' 已被使用`);
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    return new RoleResponseDto(updatedRole);
  }

  async remove(id: number): Promise<void> {
    // 检查角色是否存在
    await this.findOne(id);

    // 检查角色是否已被分配给用户
    const userRolesCount = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM user_roles WHERE role_id = ${id}
    ` as [{ count: number }];
    
    const usersWithRole = Number(userRolesCount[0].count);

    if (usersWithRole > 0) {
      throw new ConflictException(`无法删除角色：该角色已分配给${usersWithRole}个用户`);
    }

    // 删除角色
    await this.prisma.role.delete({
      where: { id },
    });
  }

  async addUserToRole(roleId: number, userId: number): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(roleId);

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`ID为${userId}的用户不存在`);
    }

    // 添加用户到角色
    try {
      await this.prisma.$executeRaw`
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (${userId}, ${roleId}, NOW())
      `;
    } catch (error) {
      // 如果是唯一约束错误（已存在的关联），则忽略
      if (!error.message.includes('Duplicate entry')) {
        throw error;
      }
    }

    return this.findOne(roleId);
  }

  async removeUserFromRole(roleId: number, userId: number): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(roleId);

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`ID为${userId}的用户不存在`);
    }

    // 从角色中移除用户
    await this.prisma.$executeRaw`
      DELETE FROM user_roles 
      WHERE user_id = ${userId} AND role_id = ${roleId}
    `;

    return this.findOne(roleId);
  }

  async addPermissionToRole(roleId: number, permissionId: number): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(roleId);

    // 检查权限是否存在
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`ID为${permissionId}的权限不存在`);
    }

    // 添加权限到角色
    try {
      await this.prisma.$executeRaw`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        VALUES (${roleId}, ${permissionId}, NOW())
      `;
    } catch (error) {
      // 如果是唯一约束错误（已存在的关联），则忽略
      if (!error.message.includes('Duplicate entry')) {
        throw error;
      }
    }

    return this.findOne(roleId);
  }

  async addPermissionsToRole(roleId: number, permissionIds: number[]): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(roleId);

    // 检查所有权限是否存在
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map(p => p.id);
      const missingIds = permissionIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`以下权限ID不存在: ${missingIds.join(', ')}`);
    }

    // 批量添加权限到角色
    await Promise.all(
      permissionIds.map(async (permissionId) => {
        try {
          await this.prisma.$executeRaw`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (${roleId}, ${permissionId}, NOW())
          `;
        } catch (error) {
          // 如果是唯一约束错误（已存在的关联），则忽略
          if (!error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      })
    );

    return this.findOne(roleId);
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<RoleResponseDto> {
    // 检查角色是否存在
    await this.findOne(roleId);

    // 检查权限是否存在
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`ID为${permissionId}的权限不存在`);
    }

    // 从角色中移除权限
    await this.prisma.$executeRaw`
      DELETE FROM role_permissions 
      WHERE role_id = ${roleId} AND permission_id = ${permissionId}
    `;

    return this.findOne(roleId);
  }
}

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
            users: true,
            permissions: true,
          },
        },
      },
    });

    return roles.map(role => {
      const { _count, ...roleData } = role;
      return new RoleResponseDto({
        ...roleData,
        // @ts-ignore - 添加额外信息
        userCount: _count.users,
        // @ts-ignore - 添加额外信息
        permissionCount: _count.permissions,
      });
    });
  }

  async findOne(id: number): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
        permissions: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`ID为${id}的角色不存在`);
    }

    return new RoleResponseDto(role);
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
    const usersWithRole = await this.prisma.user.count({
      where: {
        roles: {
          some: {
            id,
          },
        },
      },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(`无法删除角色：该角色已分配给${usersWithRole}个用户`);
    }

    // 删除角色
    await this.prisma.role.delete({
      where: { id },
    });
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
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });

    return new RoleResponseDto(role);
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
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: permissionIds.map(id => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return new RoleResponseDto(role);
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
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });

    return new RoleResponseDto(role);
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

    // 将用户添加到角色
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });

    return new RoleResponseDto(role);
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
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });

    return new RoleResponseDto(role);
  }
}

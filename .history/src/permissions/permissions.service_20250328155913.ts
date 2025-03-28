import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    // 检查权限代码是否已存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code: createPermissionDto.code },
    });

    if (existingPermission) {
      throw new ConflictException('权限代码已存在');
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    return this.prisma.permission.findMany();
  }

  async findOne(id: number): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    // 检查权限是否存在
    await this.findOne(id);

    // 如果更新了权限代码，检查是否与其他权限冲突
    if (updatePermissionDto.code) {
      const existingPermission = await this.prisma.permission.findFirst({
        where: {
          code: updatePermissionDto.code,
          NOT: { id },
        },
      });

      if (existingPermission) {
        throw new ConflictException('权限代码已存在');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: number): Promise<void> {
    // 检查权限是否存在
    await this.findOne(id);

    // 删除权限
    await this.prisma.permission.delete({
      where: { id },
    });
  }

  async assignToRole(permissionId: number, roleId: number): Promise<void> {
    // 检查权限是否存在
    await this.findOne(permissionId);

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 分配权限给角色
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
    });
  }

  async removeFromRole(permissionId: number, roleId: number): Promise<void> {
    // 检查权限是否存在
    await this.findOne(permissionId);

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 从角色中移除权限
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
    });
  }
} 
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // 返回不包含密码的用户信息
    return new UserResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    // 查询所有用户及其角色
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    
    return users.map(user => {
      // 转换为适合响应的格式
      const roles = user.userRoles.map(ur => ur.role);
      return new UserResponseDto({
        ...user,
        roles,
      });
    });
  }

  async findOne(id: number): Promise<UserResponseDto> {
    // 查询用户详情，包括角色和权限
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`ID为${id}的用户不存在`);
    }

    // 转换为适合响应的格式
    const roles = user.userRoles.map(ur => {
      const role = ur.role;
      const permissions = role.rolePermissions.map(rp => rp.permission);
      return {
        ...role,
        permissions,
      };
    });

    return new UserResponseDto({
      ...user,
      roles,
    });
  }

  async findByUsername(username: string) {
    // 查询用户详情，包括角色和权限
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // 转换为适合响应的格式
    const roles = user.userRoles.map(ur => {
      const role = ur.role;
      const permissions = role.rolePermissions.map(rp => rp.permission);
      return {
        ...role,
        permissions,
      };
    });

    return {
      ...user,
      roles,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // 检查用户是否存在
    await this.findOne(id);

    // 如果有密码需要更新，先加密
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    // 更新用户
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // 重新获取用户信息以包含角色
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // 检查用户是否存在
    await this.findOne(id);

    // 删除用户
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<UserResponseDto> {
    // 检查用户是否存在
    await this.findOne(userId);

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`ID为${roleId}的角色不存在`);
    }

    // 添加用户到角色
    try {
      await this.prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    } catch (error) {
      // 如果关联已存在，忽略错误
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }

    return this.findOne(userId);
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<UserResponseDto> {
    // 检查关联是否存在
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException(`用户(ID: ${userId})与角色(ID: ${roleId})的关联不存在`);
    }

    // 删除关联
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return this.findOne(userId);
  }

  // 添加获取用户角色的方法
  async getUserRoles(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user.userRoles.map(ur => ur.role);
  }
} 
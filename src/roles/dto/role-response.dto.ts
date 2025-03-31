import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

// 简化的用户DTO
class SimpleUserDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiPropertyOptional({ description: '昵称', example: '管理员', nullable: true })
  nickname?: string | null;
}

// 简化的权限DTO
class SimplePermissionDto {
  @ApiProperty({ description: '权限ID', example: 1 })
  id: number;

  @ApiProperty({ description: '权限名称', example: 'GitLab查看分支' })
  name: string;

  @ApiProperty({ description: '权限编码', example: 'gitlab:branches:read' })
  code: string;

  @ApiPropertyOptional({ description: '权限描述', example: 'GitLab查看分支列表权限', nullable: true })
  description?: string | null;
}

export class RoleResponseDto {
  @ApiProperty({ description: '角色ID', example: 1 })
  id: number;

  @ApiProperty({ description: '角色名称', example: 'admin' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述', example: '系统管理员', nullable: true })
  description?: string | null;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  // 额外属性（用于显示角色关联信息）
  @ApiPropertyOptional({ description: '用户数量', example: 5 })
  userCount?: number;

  @ApiPropertyOptional({ description: '权限数量', example: 10 })
  permissionCount?: number;

  // 关联数据
  @ApiPropertyOptional({ description: '关联的用户', type: [SimpleUserDto] })
  @Type(() => SimpleUserDto)
  users?: SimpleUserDto[];

  @ApiPropertyOptional({ description: '关联的权限', type: [SimplePermissionDto] })
  @Type(() => SimplePermissionDto)
  permissions?: SimplePermissionDto[];

  // 隐藏内部关联字段
  @Exclude()
  userRoles?: any[];

  @Exclude()
  rolePermissions?: any[];

  constructor(partial: Partial<RoleResponseDto>) {
    Object.assign(this, partial);
  }
} 
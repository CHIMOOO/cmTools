import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 简化的角色DTO
class SimpleRoleDto {
  @ApiProperty({ description: '角色ID', example: 1 })
  id: number;

  @ApiProperty({ description: '角色名称', example: 'admin' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述', example: '系统管理员', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ description: '角色权限', type: 'array', example: [] })
  permissions?: any[];
}

export class UserResponseDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: '用户昵称', example: '张三', nullable: true })
  nickname: string | null;

  @ApiProperty({ description: '用户头像URL', example: 'https://example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: '用户是否激活', example: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  @Exclude()
  @ApiHideProperty()
  password: string;

  @ApiProperty({
    description: '用户角色',
    type: [SimpleRoleDto],
    example: [{ id: 1, name: '管理员', description: '系统管理员' }]
  })
  @Type(() => SimpleRoleDto)
  roles?: SimpleRoleDto[];

  // 隐藏内部关联字段
  @Exclude()
  userRoles?: any[];

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
} 
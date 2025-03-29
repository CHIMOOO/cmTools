import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiPropertyOptional({ description: '关联的用户', type: 'array' })
  users?: any[];

  @ApiPropertyOptional({ description: '关联的权限', type: 'array' })
  permissions?: any[];

  constructor(partial: Partial<RoleResponseDto>) {
    Object.assign(this, partial);
  }
} 
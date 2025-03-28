import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ description: '权限ID', example: 1 })
  id: number;

  @ApiProperty({ description: '权限名称', example: '用户管理' })
  name: string;

  @ApiProperty({ description: '权限代码', example: 'user:manage' })
  code: string;

  @ApiProperty({ description: '权限描述', example: '用户管理相关权限', nullable: true })
  description: string | null;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
} 
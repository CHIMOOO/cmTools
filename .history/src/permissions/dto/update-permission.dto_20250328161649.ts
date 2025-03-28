import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiProperty({ description: '权限名称', example: '用户管理', required: false })
  @IsOptional()
  @IsString({ message: '权限名称必须是字符串' })
  name?: string;

  @ApiProperty({ description: '权限代码', example: 'user:manage', required: false })
  @IsOptional()
  @IsString({ message: '权限代码必须是字符串' })
  code?: string;

  @ApiProperty({ description: '权限描述', example: '用户管理相关权限', required: false })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;
} 
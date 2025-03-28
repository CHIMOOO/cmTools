import { IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString({ message: '权限名称必须是字符串' })
  name?: string;

  @IsOptional()
  @IsString({ message: '权限代码必须是字符串' })
  code?: string;

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;
} 
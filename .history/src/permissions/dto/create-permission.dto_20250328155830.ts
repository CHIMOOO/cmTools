import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty({ message: '权限名称不能为空' })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @IsNotEmpty({ message: '权限代码不能为空' })
  @IsString({ message: '权限代码必须是字符串' })
  code: string;

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;
} 
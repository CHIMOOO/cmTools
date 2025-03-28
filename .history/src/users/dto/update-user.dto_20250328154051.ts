import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: '头像地址必须是字符串' })
  avatar?: string;
} 
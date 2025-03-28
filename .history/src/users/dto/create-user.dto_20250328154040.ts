import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: '头像地址必须是字符串' })
  avatar?: string;
} 
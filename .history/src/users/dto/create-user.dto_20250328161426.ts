import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'johndoe' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6 })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password: string;

  @ApiProperty({ description: '用户昵称', example: '张三', required: false })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;

  @ApiProperty({ description: '用户头像URL', example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString({ message: '头像地址必须是字符串' })
  avatar?: string;
} 
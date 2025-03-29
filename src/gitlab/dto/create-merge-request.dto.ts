import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMergeRequestDto {
  @ApiProperty({
    description: '源分支',
    example: 'feature/login-page',
  })
  @IsNotEmpty({ message: '源分支不能为空' })
  @IsString({ message: '源分支必须是字符串' })
  sourceBranch: string;

  @ApiProperty({
    description: '目标分支',
    example: 'master',
  })
  @IsNotEmpty({ message: '目标分支不能为空' })
  @IsString({ message: '目标分支必须是字符串' })
  targetBranch: string;

  @ApiProperty({
    description: '合并请求标题',
    example: '实现登录页面功能',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  @MaxLength(255, { message: '标题不能超过255个字符' })
  title: string;

  @ApiProperty({
    description: '合并请求描述',
    example: '实现了登录表单和相关的API集成',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @ApiProperty({
    description: '是否在合并后删除源分支',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  removeSourceBranch?: boolean;

  @ApiProperty({
    description: '是否压缩提交',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  squash?: boolean;
} 
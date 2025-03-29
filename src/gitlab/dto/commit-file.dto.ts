import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBase64 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CommitFileDto {
  @ApiProperty({
    description: '分支名称',
    example: 'feature/login-page',
  })
  @IsNotEmpty({ message: '分支名称不能为空' })
  @IsString({ message: '分支名称必须是字符串' })
  branch: string;

  @ApiProperty({
    description: '文件路径',
    example: 'src/components/LoginForm.vue',
  })
  @IsNotEmpty({ message: '文件路径不能为空' })
  @IsString({ message: '文件路径必须是字符串' })
  filePath: string;

  @ApiProperty({
    description: '提交信息',
    example: '添加登录表单组件',
  })
  @IsNotEmpty({ message: '提交信息不能为空' })
  @IsString({ message: '提交信息必须是字符串' })
  @MaxLength(500, { message: '提交信息不能超过500个字符' })
  commitMessage: string;

  @ApiProperty({
    description: '文件内容（Base64编码）',
    example: 'PHRlbXBsYXRlPgogIDxkaXY+CiAgICBMb2dpbiBGb3JtCiAgPC9kaXY+CjwvdGVtcGxhdGU+',
  })
  @IsNotEmpty({ message: '文件内容不能为空' })
  @IsString({ message: '文件内容必须是字符串' })
  @IsBase64()
  content: string;

  @ApiProperty({
    description: '上一次提交的SHA值（用于更新文件时需要提供，新文件不需要）',
    example: 'a7b6c5d4e3f2a1b0c9d8e7f6',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '上一次提交的SHA值必须是字符串' })
  lastCommitId?: string;

  @ApiProperty({
    description: '是否执行自动合并（如果发生冲突）',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  autoMerge?: boolean;
} 
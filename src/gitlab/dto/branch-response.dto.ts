import { ApiProperty } from '@nestjs/swagger';

export class CommitAuthorDto {
  @ApiProperty({ description: '提交者姓名', example: '张三' })
  name: string;

  @ApiProperty({ description: '提交者邮箱', example: 'zhangsan@example.com' })
  email: string;

  @ApiProperty({ description: '提交时间', example: '2023-01-01T12:34:56Z' })
  date: string;
}

export class CommitDto {
  @ApiProperty({ description: '提交ID', example: 'a7b6c5d4e3f2a1b0c9d8e7f6' })
  id: string;

  @ApiProperty({ description: '短提交ID', example: 'a7b6c5d' })
  short_id: string;

  @ApiProperty({ description: '提交标题', example: '添加登录表单组件' })
  title: string;

  @ApiProperty({ description: '提交信息', example: '添加登录表单组件和相关逻辑' })
  message: string;

  @ApiProperty({ description: '提交者', type: CommitAuthorDto })
  author: CommitAuthorDto;

  @ApiProperty({ description: '提交时间', example: '2023-01-01T12:34:56Z' })
  created_at: string;
}

export class BranchDetailsDto {
  @ApiProperty({ description: '分支名称', example: 'feature/login-page' })
  name: string;

  @ApiProperty({ description: '是否受保护', example: false })
  protected: boolean;

  @ApiProperty({ description: '是否默认分支', example: false })
  default: boolean;

  @ApiProperty({ description: '是否可以被推送', example: true })
  can_push: boolean;

  @ApiProperty({ description: '最近提交', type: CommitDto })
  commit: CommitDto;

  @ApiProperty({ description: '合并状态', example: 'can_be_merged' })
  merged: boolean;
}

export class BranchResponseDto {
  @ApiProperty({ description: '分支详情', type: BranchDetailsDto })
  branch: BranchDetailsDto;

  @ApiProperty({ description: '创建者昵称', example: '张三' })
  creatorNickname?: string;

  @ApiProperty({ description: '最后修改者昵称', example: '李四' })
  lastModifierNickname?: string;
} 
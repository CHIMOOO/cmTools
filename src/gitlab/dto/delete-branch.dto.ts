import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteBranchDto {
  @ApiProperty({
    description: '要删除的分支名称',
    example: 'feature/login-page',
  })
  @IsNotEmpty({ message: '分支名称不能为空' })
  @IsString({ message: '分支名称必须是字符串' })
  name: string;
} 
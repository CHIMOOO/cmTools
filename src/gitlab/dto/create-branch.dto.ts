import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: '分支名称' })
  @IsNotEmpty({ message: '分支名称不能为空' })
  @IsString({ message: '分支名称必须是字符串' })
  @MaxLength(255, { message: '分支名称不能超过255个字符' })
  name: string;

  @ApiPropertyOptional({ description: '源分支或标签名称，默认为master' })
  @IsOptional()
  @IsString({ message: '源分支必须是字符串' })
  ref?: string;

  @ApiPropertyOptional({ description: '分支描述' })
  @IsOptional()
  @IsString({ message: '分支描述必须是字符串' })
  description?: string;
} 
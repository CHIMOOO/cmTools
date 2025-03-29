import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: 'editor' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString({ message: '角色名称必须是字符串' })
  @MaxLength(50, { message: '角色名称最大长度为50个字符' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述', example: '内容编辑人员' })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述最大长度为200个字符' })
  description?: string;
} 
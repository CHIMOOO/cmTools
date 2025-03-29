import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({ description: '角色描述', example: '内容编辑人员' })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述最大长度为200个字符' })
  description?: string;
} 
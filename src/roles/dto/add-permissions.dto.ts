import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class AddPermissionsDto {
  @ApiProperty({
    description: '权限ID数组',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  permissionIds: number[];
} 
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: '用户昵称', example: '张三', nullable: true })
  nickname: string | null;

  @ApiProperty({ description: '用户头像URL', example: 'https://example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: '用户是否激活', example: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  @Exclude()
  @ApiHideProperty()
  password: string;

  @Expose()
  @ApiProperty({
    description: '用户角色',
    example: [{ id: 1, name: '管理员', description: '系统管理员' }]
  })
  get roles() {
    return this._roles?.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description
    }));
  }

  private _roles: any[];

  constructor(partial: Partial<UserResponseDto> & { roles?: any[] }) {
    Object.assign(this, partial);
    if (partial.roles) {
      this._roles = partial.roles;
    }
  }
} 
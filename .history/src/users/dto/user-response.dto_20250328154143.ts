import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  @Expose()
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
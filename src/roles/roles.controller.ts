import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto, AddPermissionsDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, Role } from '../auth';

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: '角色名称已存在' })
  @Roles(Role.ADMIN)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有角色' })
  @ApiResponse({ status: 200, description: '成功', type: [RoleResponseDto] })
  @Roles(Role.ADMIN, Role.USER)
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @Roles(Role.ADMIN, Role.USER)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 409, description: '角色名称已被使用' })
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 409, description: '角色已被用户使用，无法删除' })
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: '添加单个权限到角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiParam({ name: 'permissionId', description: '权限ID' })
  @ApiResponse({ status: 200, description: '添加成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  @Roles(Role.ADMIN)
  async addPermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<RoleResponseDto> {
    return this.rolesService.addPermissionToRole(roleId, permissionId);
  }

  @Post(':roleId/permissions')
  @ApiOperation({ summary: '批量添加权限到角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiBody({ type: AddPermissionsDto })
  @ApiResponse({ status: 200, description: '批量添加成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  @Roles(Role.ADMIN)
  async addPermissionsToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() addPermissionsDto: AddPermissionsDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.addPermissionsToRole(roleId, addPermissionsDto.permissionIds);
  }

  @Delete(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: '从角色移除权限' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiParam({ name: 'permissionId', description: '权限ID' })
  @ApiResponse({ status: 200, description: '移除成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  @Roles(Role.ADMIN)
  async removePermissionFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<RoleResponseDto> {
    return this.rolesService.removePermissionFromRole(roleId, permissionId);
  }

  @Post(':roleId/users/:userId')
  @ApiOperation({ summary: '将用户添加到角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '添加成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色或用户不存在' })
  @Roles(Role.ADMIN)
  async addUserToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<RoleResponseDto> {
    return this.rolesService.addUserToRole(roleId, userId);
  }

  @Delete(':roleId/users/:userId')
  @ApiOperation({ summary: '从角色移除用户' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '移除成功', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: '角色或用户不存在' })
  @Roles(Role.ADMIN)
  async removeUserFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<RoleResponseDto> {
    return this.rolesService.removeUserFromRole(roleId, userId);
  }
}

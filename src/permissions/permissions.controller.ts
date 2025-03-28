import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('权限')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: '创建权限', description: '创建一个新权限' })
  @ApiResponse({ status: 201, description: '权限创建成功', type: PermissionResponseDto })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 409, description: '权限代码已存在' })
  @ApiBody({ type: CreatePermissionDto })
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有权限', description: '获取系统中所有权限的列表' })
  @ApiResponse({ status: 200, description: '返回权限列表', type: [PermissionResponseDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个权限', description: '通过ID获取单个权限信息' })
  @ApiResponse({ status: 200, description: '返回权限信息', type: PermissionResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '权限ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PermissionResponseDto> {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新权限', description: '更新权限信息' })
  @ApiResponse({ status: 200, description: '权限更新成功', type: PermissionResponseDto })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 409, description: '权限代码已存在' })
  @ApiParam({ name: 'id', type: 'number', description: '权限ID' })
  @ApiBody({ type: UpdatePermissionDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限', description: '删除一个权限' })
  @ApiResponse({ status: 200, description: '权限删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '权限ID' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.permissionsService.remove(id);
  }

  @Post(':id/roles/:roleId')
  @ApiOperation({ summary: '分配权限给角色', description: '将权限分配给角色' })
  @ApiResponse({ status: 200, description: '权限分配成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '权限或角色不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '权限ID' })
  @ApiParam({ name: 'roleId', type: 'number', description: '角色ID' })
  async assignToRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<void> {
    return this.permissionsService.assignToRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @ApiOperation({ summary: '从角色移除权限', description: '从角色中移除权限' })
  @ApiResponse({ status: 200, description: '权限移除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '权限或角色不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '权限ID' })
  @ApiParam({ name: 'roleId', type: 'number', description: '角色ID' })
  async removeFromRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<void> {
    return this.permissionsService.removeFromRole(id, roleId);
  }
} 
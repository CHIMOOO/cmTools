import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('用户')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '创建用户', description: '创建一个新用户' })
  @ApiResponse({ status: 201, description: '用户创建成功', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有用户', description: '获取系统中的所有用户列表' })
  @ApiResponse({ status: 200, description: '返回用户列表', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个用户', description: '通过ID获取单个用户信息' })
  @ApiResponse({ status: 200, description: '返回用户信息', type: UserResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '用户ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户', description: '更新用户信息' })
  @ApiResponse({ status: 200, description: '用户更新成功', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '用户ID' })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除用户', description: '删除一个用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '用户ID' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/roles/:roleId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '分配角色', description: '为用户分配一个角色' })
  @ApiResponse({ status: 200, description: '角色分配成功', type: UserResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  @ApiParam({ name: 'userId', type: 'number', description: '用户ID' })
  @ApiParam({ name: 'roleId', type: 'number', description: '角色ID' })
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<UserResponseDto> {
    return this.usersService.assignRoleToUser(userId, roleId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId/roles/:roleId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '移除角色', description: '移除用户的一个角色' })
  @ApiResponse({ status: 200, description: '角色移除成功', type: UserResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  @ApiParam({ name: 'userId', type: 'number', description: '用户ID' })
  @ApiParam({ name: 'roleId', type: 'number', description: '角色ID' })
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<UserResponseDto> {
    return this.usersService.removeRoleFromUser(userId, roleId);
  }
} 
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, Role, User } from '../auth';
import { GitlabService } from './gitlab.service';
import {
  CreateBranchDto,
  CommitFileDto,
  DeleteBranchDto,
  BranchResponseDto,
  CreateMergeRequestDto,
} from './dto';

@ApiTags('gitlab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gitlab')
export class GitlabController {
  constructor(private readonly gitlabService: GitlabService) {}

  @Get('branches')
  @ApiOperation({ summary: '获取所有分支' })
  @ApiResponse({ status: 200, description: '成功', type: [BranchResponseDto] })
  @Roles(Role.USER, Role.ADMIN)
  async getAllBranches(@User('id') userId: number): Promise<BranchResponseDto[]> {
    return this.gitlabService.getAllBranches(userId);
  }

  @Get('branches/:name')
  @ApiOperation({ summary: '获取分支详情' })
  @ApiParam({ name: 'name', description: '分支名称' })
  @ApiResponse({ status: 200, description: '成功', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: '分支不存在' })
  @Roles(Role.USER, Role.ADMIN)
  async getBranch(
    @Param('name') name: string,
    @User('id') userId: number,
  ): Promise<BranchResponseDto> {
    return this.gitlabService.getBranch(name, userId);
  }

  @Post('branches')
  @ApiOperation({ summary: '创建分支' })
  @ApiResponse({ status: 201, description: '成功创建', type: BranchResponseDto })
  @ApiResponse({ status: 400, description: '创建失败' })
  @Roles(Role.USER, Role.ADMIN)
  async createBranch(
    @Body() createBranchDto: CreateBranchDto,
    @User('id') userId: number,
  ): Promise<BranchResponseDto> {
    return this.gitlabService.createBranch(createBranchDto, userId);
  }

  @Delete('branches')
  @ApiOperation({ summary: '删除分支' })
  @ApiResponse({ status: 200, description: '成功删除' })
  @ApiResponse({ status: 404, description: '分支不存在' })
  @ApiResponse({ status: 400, description: '删除失败' })
  @Roles(Role.USER, Role.ADMIN)
  async deleteBranch(
    @Body() deleteBranchDto: DeleteBranchDto,
    @User('id') userId: number,
  ): Promise<void> {
    return this.gitlabService.deleteBranch(deleteBranchDto, userId);
  }

  @Post('commit')
  @ApiOperation({ summary: '提交文件' })
  @ApiResponse({ status: 201, description: '成功提交' })
  @ApiResponse({ status: 400, description: '提交失败' })
  @Roles(Role.USER, Role.ADMIN)
  async commitFile(
    @Body() commitFileDto: CommitFileDto,
    @User('id') userId: number,
  ): Promise<any> {
    return this.gitlabService.commitFile(commitFileDto, userId);
  }

  @Get('files')
  @ApiOperation({ summary: '获取文件内容' })
  @ApiQuery({ name: 'branch', description: '分支名称' })
  @ApiQuery({ name: 'path', description: '文件路径' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @Roles(Role.USER, Role.ADMIN)
  async getFileContent(
    @Query('branch') branch: string,
    @Query('path') path: string,
    @User('id') userId: number,
  ): Promise<string> {
    if (!branch || !path) {
      throw new BadRequestException('分支名称和文件路径不能为空');
    }
    return this.gitlabService.getFileContent(branch, path, userId);
  }

  @Post('merge-requests')
  @ApiOperation({ summary: '创建合并请求' })
  @ApiResponse({ status: 201, description: '成功创建' })
  @ApiResponse({ status: 400, description: '创建失败' })
  @Roles(Role.USER, Role.ADMIN)
  async createMergeRequest(
    @Body() createMergeRequestDto: CreateMergeRequestDto,
    @User('id') userId: number,
  ): Promise<any> {
    return this.gitlabService.createMergeRequest(createMergeRequestDto, userId);
  }

  @Get('merge-requests')
  @ApiOperation({ summary: '获取所有合并请求' })
  @ApiResponse({ status: 200, description: '成功' })
  @Roles(Role.USER, Role.ADMIN)
  async getAllMergeRequests(@User('id') userId: number): Promise<any[]> {
    return this.gitlabService.getAllMergeRequests(userId);
  }

  @Get('merge-requests/:id')
  @ApiOperation({ summary: '获取合并请求详情' })
  @ApiParam({ name: 'id', description: '合并请求ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '合并请求不存在' })
  @Roles(Role.USER, Role.ADMIN)
  async getMergeRequest(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId: number,
  ): Promise<any> {
    return this.gitlabService.getMergeRequest(id, userId);
  }

  @Post('merge-requests/:id/accept')
  @ApiOperation({ summary: '接受合并请求' })
  @ApiParam({ name: 'id', description: '合并请求ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 400, description: '操作失败' })
  @Roles(Role.USER, Role.ADMIN)
  async acceptMergeRequest(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId: number,
  ): Promise<any> {
    return this.gitlabService.acceptMergeRequest(id, userId);
  }

  @Get('logs')
  @ApiOperation({ summary: '获取操作日志' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '成功' })
  @Roles(Role.USER, Role.ADMIN)
  async getOperationLogs(
    @User('id') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<any> {
    return this.gitlabService.getOperationLogs(
      userId,
      page ? parseInt(page as any, 10) : 1,
      pageSize ? parseInt(pageSize as any, 10) : 20,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: '获取项目统计信息' })
  @ApiResponse({ status: 200, description: '成功' })
  @Roles(Role.USER, Role.ADMIN)
  async getProjectStats(@User('id') userId: number): Promise<any> {
    return this.gitlabService.getProjectStats(userId);
  }

  @Get('test')
  @ApiOperation({ summary: '测试接口 - 不需要角色权限' })
  @ApiResponse({ status: 200, description: '成功' })
  async testEndpoint(@User('id') userId: number): Promise<any> {
    return {
      success: true,
      message: '测试接口访问成功',
      userId,
      timestamp: new Date().toISOString()
    };
  }
  
  @Get('test-with-role')
  @ApiOperation({ summary: '测试接口 - 需要角色权限' })
  @ApiResponse({ status: 200, description: '成功' })
  @Roles(Role.USER, Role.ADMIN)
  async testWithRoleEndpoint(@User('id') userId: number): Promise<any> {
    return {
      success: true,
      message: '带角色权限的测试接口访问成功',
      userId,
      roles: [Role.USER, Role.ADMIN],
      timestamp: new Date().toISOString()
    };
  }
} 
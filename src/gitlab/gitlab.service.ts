import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateBranchDto, 
  CommitFileDto, 
  DeleteBranchDto, 
  BranchResponseDto,
  CreateMergeRequestDto
} from './dto';
import { GitlabConfig } from './gitlab-config.interface';
import { Gitlab } from '@gitbeaker/node';
import * as path from 'path';

// 定义提交动作类型
interface CommitAction {
  action: string;
  file_path: string;
  content: string;
  encoding: string;
  last_commit_id?: string;
}

@Injectable()
export class GitlabService {
  private readonly logger = new Logger(GitlabService.name);
  private readonly gitlabClient: any;
  private readonly gitlabConfig: GitlabConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // 初始化GitLab客户端
    this.gitlabConfig = {
      baseUrl: 'http://172.168.52.12',
      token: 'xqTaPLRoDUjLkHQHbmtQ',
      projectId: 'sd4/cloud/front/panelmachine/panelmachine-version',
      defaultBranch: 'master',
    };

    this.gitlabClient = new Gitlab({
      host: this.gitlabConfig.baseUrl,
      token: this.gitlabConfig.token,
    });
  }

  /**
   * 记录GitLab操作日志
   */
  private async logOperation(
    userId: number,
    operation: string,
    status: 'SUCCESS' | 'FAILED',
    data: {
      branchName?: string;
      commitMessage?: string;
      commitSha?: string;
      filePath?: string;
      errorMessage?: string;
      metadata?: any;
    },
  ) {
    try {
      await this.prisma.gitlabOperationLog.create({
        data: {
          userId,
          operation,
          branchName: data.branchName,
          commitMessage: data.commitMessage,
          commitSha: data.commitSha,
          filePath: data.filePath,
          status,
          errorMessage: data.errorMessage,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error) {
      this.logger.error(`记录GitLab操作日志失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 获取所有分支
   */
  async getAllBranches(userId: number): Promise<BranchResponseDto[]> {
    try {
      const branches = await this.gitlabClient.Branches.all(this.gitlabConfig.projectId);
      
      // 查询每个分支的创建者和最后修改者
      const branchesWithAuthors = await Promise.all(
        branches.map(async (branch) => {
          // 获取分支的提交历史
          const commits = await this.gitlabClient.Commits.all(
            this.gitlabConfig.projectId,
            { ref_name: branch.name, per_page: 100 },
          );

          // 第一个提交通常是分支的创建者
          const firstCommit = commits[commits.length - 1];
          // 最新的提交是最后的修改者
          const lastCommit = commits[0];

          // 查询用户昵称（通过邮箱匹配）
          const response = {
            branch,
            creatorNickname: firstCommit?.author_name || '未知',
            lastModifierNickname: lastCommit?.author_name || '未知',
          };

          return response;
        }),
      );

      await this.logOperation(userId, 'LIST_BRANCHES', 'SUCCESS', {
        metadata: { count: branches.length },
      });

      return branchesWithAuthors;
    } catch (error) {
      await this.logOperation(userId, 'LIST_BRANCHES', 'FAILED', {
        errorMessage: error.message,
      });
      this.logger.error(`获取分支列表失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取分支列表失败: ${error.message}`);
    }
  }

  /**
   * 获取单个分支
   */
  async getBranch(branchName: string, userId: number): Promise<BranchResponseDto> {
    try {
      const branch = await this.gitlabClient.Branches.show(
        this.gitlabConfig.projectId,
        branchName,
      );

      // 获取分支的提交历史
      const commits = await this.gitlabClient.Commits.all(
        this.gitlabConfig.projectId,
        { ref_name: branch.name, per_page: 100 },
      );

      // 第一个提交通常是分支的创建者
      const firstCommit = commits[commits.length - 1];
      // 最新的提交是最后的修改者
      const lastCommit = commits[0];

      await this.logOperation(userId, 'GET_BRANCH', 'SUCCESS', {
        branchName,
      });

      return {
        branch,
        creatorNickname: firstCommit?.author_name || '未知',
        lastModifierNickname: lastCommit?.author_name || '未知',
      };
    } catch (error) {
      await this.logOperation(userId, 'GET_BRANCH', 'FAILED', {
        branchName,
        errorMessage: error.message,
      });
      this.logger.error(`获取分支失败: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(`分支不存在: ${branchName}`);
      }
      throw new BadRequestException(`获取分支失败: ${error.message}`);
    }
  }

  /**
   * 创建分支
   */
  async createBranch(createBranchDto: CreateBranchDto, userId: number): Promise<BranchResponseDto> {
    try {
      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const ref = createBranchDto.ref || this.gitlabConfig.defaultBranch;
      const branch = await this.gitlabClient.Branches.create(
        this.gitlabConfig.projectId,
        createBranchDto.name,
        ref,
      );

      await this.logOperation(userId, 'CREATE_BRANCH', 'SUCCESS', {
        branchName: createBranchDto.name,
        metadata: { ref, description: createBranchDto.description },
      });

      return {
        branch,
        creatorNickname: user.nickname || user.username,
        lastModifierNickname: user.nickname || user.username,
      };
    } catch (error) {
      await this.logOperation(userId, 'CREATE_BRANCH', 'FAILED', {
        branchName: createBranchDto.name,
        errorMessage: error.message,
      });
      this.logger.error(`创建分支失败: ${error.message}`, error.stack);
      throw new BadRequestException(`创建分支失败: ${error.message}`);
    }
  }

  /**
   * 删除分支
   */
  async deleteBranch(deleteBranchDto: DeleteBranchDto, userId: number): Promise<void> {
    try {
      // 检查分支是否存在
      await this.getBranch(deleteBranchDto.name, userId);

      // 删除分支
      await this.gitlabClient.Branches.remove(
        this.gitlabConfig.projectId,
        deleteBranchDto.name,
      );

      await this.logOperation(userId, 'DELETE_BRANCH', 'SUCCESS', {
        branchName: deleteBranchDto.name,
      });
    } catch (error) {
      await this.logOperation(userId, 'DELETE_BRANCH', 'FAILED', {
        branchName: deleteBranchDto.name,
        errorMessage: error.message,
      });
      this.logger.error(`删除分支失败: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(`分支不存在: ${deleteBranchDto.name}`);
      }
      throw new BadRequestException(`删除分支失败: ${error.message}`);
    }
  }

  /**
   * 提交文件（可以是新文件或更新文件）
   */
  async commitFile(commitFileDto: CommitFileDto, userId: number): Promise<any> {
    try {
      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 创建提交信息
      const actions: CommitAction[] = [
        {
          action: commitFileDto.lastCommitId ? 'update' : 'create',
          file_path: commitFileDto.filePath,
          content: Buffer.from(commitFileDto.content, 'base64').toString(),
          encoding: 'text',
        },
      ];

      // 如果提供了上一次提交ID，则添加到actions中
      if (commitFileDto.lastCommitId) {
        actions[0].last_commit_id = commitFileDto.lastCommitId;
      }

      // 进行提交
      const authorName = user.nickname || user.username;
      const commit = await this.gitlabClient.Commits.create(
        this.gitlabConfig.projectId,
        commitFileDto.branch,
        commitFileDto.commitMessage,
        actions,
        {
          author_name: authorName,
          author_email: `${authorName}@example.com`,
        },
      );

      await this.logOperation(userId, 'COMMIT_FILE', 'SUCCESS', {
        branchName: commitFileDto.branch,
        commitMessage: commitFileDto.commitMessage,
        commitSha: commit.id,
        filePath: commitFileDto.filePath,
      });

      return commit;
    } catch (error) {
      await this.logOperation(userId, 'COMMIT_FILE', 'FAILED', {
        branchName: commitFileDto.branch,
        commitMessage: commitFileDto.commitMessage,
        filePath: commitFileDto.filePath,
        errorMessage: error.message,
      });
      this.logger.error(`提交文件失败: ${error.message}`, error.stack);
      throw new BadRequestException(`提交文件失败: ${error.message}`);
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(branchName: string, filePath: string, userId: number): Promise<string> {
    try {
      const file = await this.gitlabClient.RepositoryFiles.show(
        this.gitlabConfig.projectId,
        filePath,
        branchName,
      );

      await this.logOperation(userId, 'GET_FILE', 'SUCCESS', {
        branchName,
        filePath,
      });

      // 返回Base64编码的内容
      return file.content;
    } catch (error) {
      await this.logOperation(userId, 'GET_FILE', 'FAILED', {
        branchName,
        filePath,
        errorMessage: error.message,
      });
      this.logger.error(`获取文件内容失败: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(
          `文件不存在: ${path.join(branchName, filePath)}`,
        );
      }
      throw new BadRequestException(`获取文件内容失败: ${error.message}`);
    }
  }

  /**
   * 创建合并请求
   */
  async createMergeRequest(createMergeRequestDto: CreateMergeRequestDto, userId: number): Promise<any> {
    try {
      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const mergeRequest = await this.gitlabClient.MergeRequests.create(
        this.gitlabConfig.projectId,
        createMergeRequestDto.sourceBranch,
        createMergeRequestDto.targetBranch,
        createMergeRequestDto.title,
        {
          description: createMergeRequestDto.description,
          remove_source_branch: createMergeRequestDto.removeSourceBranch,
          squash: createMergeRequestDto.squash,
        },
      );

      await this.logOperation(userId, 'CREATE_MERGE_REQUEST', 'SUCCESS', {
        branchName: createMergeRequestDto.sourceBranch,
        commitMessage: createMergeRequestDto.title,
        metadata: {
          targetBranch: createMergeRequestDto.targetBranch,
          mergeRequestId: mergeRequest.iid,
        },
      });

      return mergeRequest;
    } catch (error) {
      await this.logOperation(userId, 'CREATE_MERGE_REQUEST', 'FAILED', {
        branchName: createMergeRequestDto.sourceBranch,
        commitMessage: createMergeRequestDto.title,
        errorMessage: error.message,
      });
      this.logger.error(`创建合并请求失败: ${error.message}`, error.stack);
      throw new BadRequestException(`创建合并请求失败: ${error.message}`);
    }
  }

  /**
   * 获取所有合并请求
   */
  async getAllMergeRequests(userId: number): Promise<any[]> {
    try {
      const mergeRequests = await this.gitlabClient.MergeRequests.all({
        projectId: this.gitlabConfig.projectId,
      });

      await this.logOperation(userId, 'LIST_MERGE_REQUESTS', 'SUCCESS', {
        metadata: { count: mergeRequests.length },
      });

      return mergeRequests;
    } catch (error) {
      await this.logOperation(userId, 'LIST_MERGE_REQUESTS', 'FAILED', {
        errorMessage: error.message,
      });
      this.logger.error(`获取合并请求列表失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取合并请求列表失败: ${error.message}`);
    }
  }

  /**
   * 获取单个合并请求
   */
  async getMergeRequest(mergeRequestId: number, userId: number): Promise<any> {
    try {
      const mergeRequest = await this.gitlabClient.MergeRequests.show(
        this.gitlabConfig.projectId,
        mergeRequestId,
      );

      await this.logOperation(userId, 'GET_MERGE_REQUEST', 'SUCCESS', {
        metadata: { mergeRequestId },
      });

      return mergeRequest;
    } catch (error) {
      await this.logOperation(userId, 'GET_MERGE_REQUEST', 'FAILED', {
        errorMessage: error.message,
        metadata: { mergeRequestId },
      });
      this.logger.error(`获取合并请求失败: ${error.message}`, error.stack);
      if (error.response?.status === 404) {
        throw new NotFoundException(`合并请求不存在: ${mergeRequestId}`);
      }
      throw new BadRequestException(`获取合并请求失败: ${error.message}`);
    }
  }

  /**
   * 接受合并请求
   */
  async acceptMergeRequest(mergeRequestId: number, userId: number): Promise<any> {
    try {
      const mergeRequest = await this.gitlabClient.MergeRequests.accept(
        this.gitlabConfig.projectId,
        mergeRequestId,
      );

      await this.logOperation(userId, 'ACCEPT_MERGE_REQUEST', 'SUCCESS', {
        metadata: { mergeRequestId },
      });

      return mergeRequest;
    } catch (error) {
      await this.logOperation(userId, 'ACCEPT_MERGE_REQUEST', 'FAILED', {
        errorMessage: error.message,
        metadata: { mergeRequestId },
      });
      this.logger.error(`接受合并请求失败: ${error.message}`, error.stack);
      throw new BadRequestException(`接受合并请求失败: ${error.message}`);
    }
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(userId: number, page: number = 1, pageSize: number = 20): Promise<any> {
    const skip = (page - 1) * pageSize;
    const total = await this.prisma.gitlabOperationLog.count({
      where: { userId },
    });

    const logs = await this.prisma.gitlabOperationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
    });

    return {
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(userId: number): Promise<any> {
    try {
      // 获取项目信息
      const project = await this.gitlabClient.Projects.show(this.gitlabConfig.projectId);
      
      // 获取分支数量
      const branches = await this.gitlabClient.Branches.all(this.gitlabConfig.projectId);
      
      // 获取提交数量
      const commits = await this.gitlabClient.Commits.all(this.gitlabConfig.projectId);
      
      // 获取合并请求数量
      const mergeRequests = await this.gitlabClient.MergeRequests.all({
        projectId: this.gitlabConfig.projectId,
      });

      // 用户操作统计
      const userOperations = await this.prisma.gitlabOperationLog.groupBy({
        by: ['operation', 'status'],
        where: { userId },
        _count: true,
      });

      const stats = {
        project: {
          name: project.name,
          description: project.description,
          defaultBranch: project.default_branch,
          webUrl: project.web_url,
          lastActivityAt: project.last_activity_at,
        },
        branches: {
          total: branches.length,
        },
        commits: {
          total: commits.length,
        },
        mergeRequests: {
          total: mergeRequests.length,
          open: mergeRequests.filter(mr => mr.state === 'opened').length,
          merged: mergeRequests.filter(mr => mr.state === 'merged').length,
          closed: mergeRequests.filter(mr => mr.state === 'closed').length,
        },
        userOperations: userOperations.reduce((acc, op) => {
          const key = `${op.operation}_${op.status}`;
          acc[key] = op._count;
          return acc;
        }, {}),
      };

      await this.logOperation(userId, 'GET_PROJECT_STATS', 'SUCCESS', {});

      return stats;
    } catch (error) {
      await this.logOperation(userId, 'GET_PROJECT_STATS', 'FAILED', {
        errorMessage: error.message,
      });
      this.logger.error(`获取项目统计信息失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取项目统计信息失败: ${error.message}`);
    }
  }
} 
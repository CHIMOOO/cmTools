import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  StreamableFile,
  Response,
  ForbiddenException,
  Patch,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { User } from '../auth/decorators/user.decorator';
import { FileResponseDto } from './dto';
import * as path from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('文件')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文件列表', description: '获取用户可访问的所有文件' })
  @ApiResponse({ status: 200, description: '返回文件列表', type: [FileResponseDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@User() user: any): Promise<FileResponseDto[]> {
    return this.filesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件信息', description: '获取指定文件的详细信息' })
  @ApiResponse({ status: 200, description: '返回文件信息', type: FileResponseDto })
  @ApiResponse({ status: 403, description: '没有权限访问此文件' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '文件ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
  ): Promise<FileResponseDto> {
    return this.filesService.findOne(id, user?.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件', description: '下载指定文件' })
  @ApiResponse({ status: 200, description: '文件流' })
  @ApiResponse({ status: 403, description: '没有权限下载此文件' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '文件ID' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.filesService.findOne(id, user?.id);

    if (!file.isPublic && (!user || file.userId !== user.id)) {
      throw new ForbiddenException('您没有权限下载此文件');
    }

    const filePath = path.join(process.cwd(), file.path);
    const fileStream = fs.createReadStream(filePath);

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    return new StreamableFile(fileStream);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传文件', description: '上传新文件' })
  @ApiResponse({ status: 201, description: '文件上传成功', type: FileResponseDto })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @User() user: any,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new Error('文件上传失败');
    }

    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');

    const newFile = await this.prisma.file.create({
      data: {
        filename: path.basename(file.path),
        originalName: file.originalname,
        path: relativePath,
        mimetype: file.mimetype,
        size: file.size,
        userId: user.id,
        isPublic: false,
      },
    });

    return this.filesService.findOne(newFile.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文件', description: '删除指定文件' })
  @ApiResponse({ status: 200, description: '文件删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '没有权限删除此文件' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '文件ID' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
  ): Promise<void> {
    return this.filesService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/visibility')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文件可见性', description: '设置文件是否公开可见' })
  @ApiResponse({ status: 200, description: '可见性更新成功', type: FileResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '没有权限修改此文件' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiParam({ name: 'id', type: 'number', description: '文件ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isPublic: {
          type: 'boolean',
          description: '是否公开可见',
          example: true,
        },
      },
      required: ['isPublic'],
    },
  })
  async updateVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isPublic: boolean },
    @User() user: any,
  ): Promise<FileResponseDto> {
    return this.filesService.updatePublicStatus(id, body.isPublic, user.id);
  }
} 
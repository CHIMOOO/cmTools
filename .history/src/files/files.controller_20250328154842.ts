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

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@User() user: any): Promise<FileResponseDto[]> {
    return this.filesService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
  ): Promise<FileResponseDto> {
    return this.filesService.findOne(id, user?.id);
  }

  @Get(':id/download')
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
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
  ): Promise<void> {
    return this.filesService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isPublic: boolean },
    @User() user: any,
  ): Promise<FileResponseDto> {
    return this.filesService.updatePublicStatus(id, body.isPublic, user.id);
  }
} 
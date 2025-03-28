import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FileResponseDto } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(userId?: number): Promise<FileResponseDto[]> {
    const files = await this.prisma.file.findMany({
      where: {
        OR: [
          { isPublic: true },
          { userId: userId || 0 },
        ],
      },
    });

    return files.map(file => this.mapFileToResponse(file));
  }

  async findOne(id: number, userId?: number): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    if (!file.isPublic && file.userId !== userId) {
      throw new ForbiddenException('您没有权限访问此文件');
    }

    return this.mapFileToResponse(file);
  }

  async remove(id: number, userId: number): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('您没有权限删除此文件');
    }

    // 删除物理文件
    const filePath = path.join(process.cwd(), file.path);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
    }

    // 删除数据库记录
    await this.prisma.file.delete({
      where: { id },
    });
  }

  async updatePublicStatus(id: number, isPublic: boolean, userId: number): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('您没有权限修改此文件');
    }

    const updatedFile = await this.prisma.file.update({
      where: { id },
      data: { isPublic },
    });

    return this.mapFileToResponse(updatedFile);
  }

  private mapFileToResponse(file: any): FileResponseDto {
    const baseUrl = this.configService.get<string>('BASE_URL') || `http://localhost:${this.configService.get<number>('PORT')}`;
    const fileResponse = { ...file } as FileResponseDto;
    fileResponse.url = `${baseUrl}/files/${file.id}`;
    return fileResponse;
  }
} 
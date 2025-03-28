import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: '文件ID', example: 1 })
  id: number;

  @ApiProperty({ description: '文件名', example: 'f8e7d6c5-b4a3-9e8d-7c6b-5a4f3e2d1c0b.jpg' })
  filename: string;

  @ApiProperty({ description: '原始文件名', example: 'profile.jpg' })
  originalName: string;

  @ApiProperty({ description: '文件路径', example: 'uploads/f8e7d6c5-b4a3-9e8d-7c6b-5a4f3e2d1c0b.jpg' })
  path: string;

  @ApiProperty({ description: '文件MIME类型', example: 'image/jpeg' })
  mimetype: string;

  @ApiProperty({ description: '文件大小(字节)', example: 12345 })
  size: number;

  @ApiProperty({ description: '上传用户ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '文件是否公开', example: false })
  isPublic: boolean;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: '文件访问URL', example: 'http://localhost:3000/files/1', required: false })
  url?: string;
} 
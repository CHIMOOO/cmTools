export class FileResponseDto {
  id: number;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  userId: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
} 
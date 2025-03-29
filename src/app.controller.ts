import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('测试')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  @ApiOperation({ summary: '测试接口', description: '用于测试服务是否正常运行' })
  @ApiResponse({ status: 200, description: '服务正常运行', schema: { 
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      message: { type: 'string', example: '服务运行正常' },
      timestamp: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' }
    }
  }})
  testService() {
    return {
      status: 'ok',
      message: '服务运行正常',
      timestamp: new Date().toISOString()
    };
  }
}

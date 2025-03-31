import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  // 用于格式化日志输出的辅助函数
  private formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  // 获取请求方法的彩色输出
  private getMethodColor(method: string): string {
    const colors = {
      GET: '\x1b[32m', // 绿色
      POST: '\x1b[34m', // 蓝色
      PUT: '\x1b[33m', // 黄色
      PATCH: '\x1b[33m', // 黄色
      DELETE: '\x1b[31m', // 红色
      OPTIONS: '\x1b[36m', // 青色
      HEAD: '\x1b[36m', // 青色
    };
    const reset = '\x1b[0m'; // 重置颜色
    return `${colors[method] || ''}${method}${reset}`;
  }

  // 获取状态码的彩色输出
  private getStatusColor(status: number): string {
    let color = '\x1b[32m'; // 默认绿色
    if (status >= 500) {
      color = '\x1b[31m'; // 500+ 红色
    } else if (status >= 400) {
      color = '\x1b[33m'; // 400+ 黄色
    } else if (status >= 300) {
      color = '\x1b[36m'; // 300+ 青色
    }
    const reset = '\x1b[0m'; // 重置颜色
    return `${color}${status}${reset}`;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const method = request.method;
    const url = request.url;
    const requestBody = request.body;
    const now = Date.now();
    const coloredMethod = this.getMethodColor(method);

    // 记录请求信息
    this.logger.log(`🔶 请求 ${coloredMethod} ${url}`);
    if (requestBody && typeof requestBody === 'object' && Object.keys(requestBody).length > 0) {
      this.logger.log(`📦 请求体:\n${this.formatJson(requestBody)}`);
    }

    return next.handle().pipe(
      map(data => {
        // 记录响应信息
        const responseTime = Date.now() - now;
        const statusCode = response.statusCode;
        const coloredStatus = this.getStatusColor(statusCode);
        
        this.logger.log(`🔷 响应 ${coloredMethod} ${url} ${coloredStatus} ${responseTime}ms`);
        
        if (data) {
          this.logger.log(`📦 响应体:\n${this.formatJson(data)}`);
        }
        
        return data;
      }),
      tap({
        error: (err) => {
          // 记录错误信息
          const responseTime = Date.now() - now;
          const statusCode = err.status || 500;
          const coloredStatus = this.getStatusColor(statusCode);
          
          this.logger.error(
            `❌ 错误 ${coloredMethod} ${url} ${coloredStatus} ${responseTime}ms`,
          );
          if (err.response) {
            this.logger.error(`📦 错误详情:\n${this.formatJson(err.response)}`);
          }
        },
      }),
    );
  }
} 
import { Module } from '@nestjs/common';
import { LoggingInterceptor } from './interceptors';

@Module({
  providers: [LoggingInterceptor],
  exports: [LoggingInterceptor],
})
export class CommonModule {} 
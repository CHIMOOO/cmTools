import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 允许跨域
  app.enableCors();

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('面板管理系统 API')
    .setDescription('面板管理系统的 REST API 文档')
    .setVersion('1.0')
    .addTag('用户', '用户管理相关接口')
    .addTag('认证', '登录和授权相关接口')
    .addTag('文件', '文件上传和管理相关接口')
    .addTag('权限', '权限和角色管理相关接口')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用已启动: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`接口文档: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();

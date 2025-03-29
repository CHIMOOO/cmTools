
## 项目描述

[Nest](https://github.com/nestjs/nest) 框架 TypeScript 启动仓库。

## 项目设置

```bash
$ pnpm install
```

## 编译和运行项目

```bash
# 开发模式
$ pnpm run start

# 监视模式
$ pnpm run start:dev

# 生产模式
$ pnpm run start:prod
```

## 运行测试

```bash
# 单元测试
$ pnpm run test

# 端到端测试
$ pnpm run test:e2e

# 测试覆盖率
$ pnpm run test:cov
```

## 部署

当您准备将 NestJS 应用程序部署到生产环境时，可以采取一些关键步骤确保其以最高效的方式运行。查看[部署文档](https://docs.nestjs.com/deployment)获取更多信息。

如果您正在寻找基于云的平台部署 NestJS 应用程序，可以查看 [Mau](https://mau.nestjs.com)，这是我们在 AWS 上部署 NestJS 应用程序的官方平台。Mau 使部署变得简单快捷，只需几个简单步骤：

```bash
$ pnpm install -g mau
$ mau deploy
```

使用 Mau，您可以只需几次点击就能部署应用程序，这样您就可以专注于构建功能而不是管理基础设施。

## 资源

以下是使用 NestJS 时可能派上用场的一些资源：

- 访问 [NestJS 文档](https://docs.nestjs.com) 了解更多关于框架的信息。
- 如有问题和支持，请访问我们的 [Discord 频道](https://discord.gg/G7Qnnhy)。
- 要深入并获得更多实践经验，请查看我们的官方视频[课程](https://courses.nestjs.com/)。
- 只需几次点击，借助 [NestJS Mau](https://mau.nestjs.com) 将应用程序部署到 AWS。
- 使用 [NestJS Devtools](https://devtools.nestjs.com) 可视化应用程序图表并实时与 NestJS 应用程序交互。
- 需要项目帮助（兼职到全职）？查看我们的官方[企业支持](https://enterprise.nestjs.com)。
- 要保持更新，请在 [X](https://x.com/nestframework) 和 [LinkedIn](https://linkedin.com/company/nestjs) 上关注我们。
- 寻找工作或有工作机会？查看我们的官方[招聘板](https://jobs.nestjs.com)。

## 支持

Nest 是一个 MIT 许可的开源项目。它可以通过赞助商和令人惊叹的支持者的支持而成长。如果您想加入他们，请[在此处阅读更多信息](https://docs.nestjs.com/support)。

## 联系方式

- 作者 - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- 网站 - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## 许可证

Nest 是 [MIT 许可](https://github.com/nestjs/nest/blob/master/LICENSE)的。

## 模块

### GitLab 集成模块

GitLab 集成模块提供了直接从应用程序与 GitLab 仓库交互的方式。该模块允许用户执行各种操作，例如：

- 查看和管理分支
- 向仓库提交文件
- 创建和接受合并请求
- 查看操作日志

#### 功能

- **分支管理**：创建、列出、查看和删除分支
- **文件操作**：向仓库提交文件并检索文件内容
- **合并请求处理**：创建合并请求、列出所有请求、查看详情和接受请求
- **日志记录**：全面记录所有 GitLab 相关操作
- **统计数据**：查看项目统计信息

#### API 端点

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| GET | `/gitlab/branches` | 获取所有分支 |
| GET | `/gitlab/branches/:name` | 获取分支详情 |
| POST | `/gitlab/branches` | 创建新分支 |
| DELETE | `/gitlab/branches` | 删除分支 |
| POST | `/gitlab/commit` | 向仓库提交文件 |
| GET | `/gitlab/files` | 获取文件内容 |
| POST | `/gitlab/merge-requests` | 创建合并请求 |
| GET | `/gitlab/merge-requests` | 获取所有合并请求 |
| GET | `/gitlab/merge-requests/:id` | 获取合并请求详情 |
| POST | `/gitlab/merge-requests/:id/accept` | 接受合并请求 |
| GET | `/gitlab/logs` | 获取操作日志 |
| GET | `/gitlab/stats` | 获取项目统计信息 |

#### 配置

GitLab 集成需要以下配置参数：

- `baseUrl`：GitLab 服务器基础 URL
- `token`：具有 API 权限的个人访问令牌
- `projectId`：目标项目的 ID 或路径
- `defaultBranch`：用于操作的默认分支

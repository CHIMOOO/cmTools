# 项目概览

本项目基于 [NestJS](https://nestjs.com/) 框架，采用 TypeScript 编写，集成了用户、角色、权限管理与 GitLab 仓库操作能力，适用于企业级后台管理系统或自动化运维平台。

## 技术栈
- Node.js + TypeScript
- NestJS 11.x
- Prisma ORM + MySQL
- JWT 认证
- GitLab API 集成
- Swagger API 文档

## 环境依赖
- Node.js >= 18.x
- pnpm >= 8.x
- MySQL >= 5.7

## 安装与启动

```bash
# 安装依赖
pnpm install

# 开发模式启动
pnpm run start:dev

# 生产模式构建与启动
pnpm run build
pnpm run start:prod
```

## 数据库初始化

1. 配置 `.env` 文件，示例：

```
DATABASE_URL="mysql://root:password@localhost:3306/panel_machine"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
```

2. 初始化数据库结构

```bash
pnpm prisma migrate dev --name init
```

3. 初始化基础数据

```bash
pnpm db:seed
```

4. 默认管理员账户

| 用户名 | 密码      | 角色         |
| ------ | --------- | ------------ |
| chimoo | ******    | 超级管理员   |
| admin  | admin123  | 系统管理员   |

## 主要功能模块

### 认证模块（/auth）
- 用户登录（JWT）
- 获取当前用户信息
- 获取当前用户角色

#### 认证接口示例
```http
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}
```
返回：
```json
{
  "accessToken": "...jwt...",
  "user": { "id": 1, "username": "admin", ... }
}
```

### 用户管理模块（/users）
- 创建、查询、更新、删除用户
- 用户分配/移除角色

#### 用户管理模块（/users）详细说明

### 1. 创建用户
- **POST** `/users`
- **请求体**（CreateUserDto）：
  | 字段      | 类型   | 必填 | 说明         |
  |-----------|--------|------|--------------|
  | username  | string | 是   | 用户名       |
  | password  | string | 是   | 密码（≥6位） |
  | nickname  | string | 否   | 用户昵称     |
  | avatar    | string | 否   | 头像URL      |

- **响应体**（UserResponseDto）：见下方DTO结构

### 2. 获取所有用户
- **GET** `/users`
- **响应体**：UserResponseDto[]

### 3. 获取单个用户
- **GET** `/users/:id`
- **响应体**：UserResponseDto

### 4. 更新用户
- **PATCH** `/users/:id`
- **请求体**（UpdateUserDto）：
  | 字段      | 类型   | 必填 | 说明         |
  |-----------|--------|------|--------------|
  | password  | string | 否   | 新密码（≥6位）|
  | nickname  | string | 否   | 用户昵称     |
  | avatar    | string | 否   | 头像URL      |

- **响应体**：UserResponseDto

### 5. 删除用户
- **DELETE** `/users/:id`
- **响应体**：无

### 6. 分配/移除角色
- **POST** `/users/:userId/roles/:roleId`  为用户分配角色
- **DELETE** `/users/:userId/roles/:roleId`  移除用户的角色
- **响应体**：UserResponseDto

#### UserResponseDto 结构
```ts
{
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: number;
    name: string;
    description?: string | null;
    permissions?: any[];
  }>;
}
```

### 角色管理模块（/roles）
- 创建、查询、更新、删除角色
- 角色分配/移除权限、用户

#### 角色管理模块（/roles）详细说明

### 1. 创建角色
- **POST** `/roles`
- **请求体**（CreateRoleDto）：
  | 字段        | 类型   | 必填 | 说明         |
  |-------------|--------|------|--------------|
  | name        | string | 是   | 角色名称     |
  | description | string | 否   | 角色描述     |

- **响应体**（RoleResponseDto）：见下方DTO结构

### 2. 获取所有角色
- **GET** `/roles`
- **响应体**：RoleResponseDto[]

### 3. 获取单个角色
- **GET** `/roles/:id`
- **响应体**：RoleResponseDto

### 4. 更新角色
- **PATCH** `/roles/:id`
- **请求体**（UpdateRoleDto）：同CreateRoleDto，字段均为可选
- **响应体**：RoleResponseDto

### 5. 删除角色
- **DELETE** `/roles/:id`
- **响应体**：无

### 6. 分配/移除权限
- **POST** `/roles/:roleId/permissions/:permissionId`  添加权限到角色
- **DELETE** `/roles/:roleId/permissions/:permissionId`  从角色移除权限
- **POST** `/roles/:roleId/permissions`  批量添加权限
  - **请求体**（AddPermissionsDto）：
    | 字段         | 类型     | 必填 | 说明         |
    |--------------|----------|------|--------------|
    | permissionIds| number[] | 是   | 权限ID数组   |
- **响应体**：RoleResponseDto

### 7. 分配/移除用户
- **POST** `/roles/:roleId/users/:userId`  将用户添加到角色
- **DELETE** `/roles/:roleId/users/:userId`  从角色移除用户
- **响应体**：RoleResponseDto

#### RoleResponseDto 结构
```ts
{
  id: number;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  permissionCount?: number;
  users?: Array<{
    id: number;
    username: string;
    nickname?: string | null;
  }>;
  permissions?: Array<{
    id: number;
    name: string;
    code: string;
    description?: string | null;
  }>;
}
```

### 权限管理模块（/permissions）
- 创建、查询、更新、删除权限
- 权限分配/移除角色

#### 权限管理模块（/permissions）详细说明

### 1. 创建权限
- **POST** `/permissions`
- **请求体**（CreatePermissionDto）：
  | 字段        | 类型   | 必填 | 说明         |
  |-------------|--------|------|--------------|
  | name        | string | 是   | 权限名称     |
  | code        | string | 是   | 权限代码     |
  | description | string | 否   | 权限描述     |
- **响应体**（PermissionResponseDto）：见下方DTO结构

### 2. 获取所有权限
- **GET** `/permissions`
- **响应体**：PermissionResponseDto[]

### 3. 获取单个权限
- **GET** `/permissions/:id`
- **响应体**：PermissionResponseDto

### 4. 更新权限
- **PATCH** `/permissions/:id`
- **请求体**（UpdatePermissionDto）：同CreatePermissionDto，字段均为可选
- **响应体**：PermissionResponseDto

### 5. 删除权限
- **DELETE** `/permissions/:id`
- **响应体**：无

### 6. 分配/移除角色
- **POST** `/permissions/:id/roles/:roleId`  分配权限给角色
- **DELETE** `/permissions/:id/roles/:roleId`  从角色移除权限
- **响应体**：无

#### PermissionResponseDto 结构
```ts
{
  id: number;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### GitLab 集成模块（/gitlab）
- 分支管理、文件提交、合并请求、操作日志、项目统计

#### GitLab 集成模块详细说明

### 1. 分支管理
- **GET** `/gitlab/branches` 获取所有分支
- **GET** `/gitlab/branches/:name` 获取分支详情
- **POST** `/gitlab/branches` 创建分支
  - **请求体**（CreateBranchDto）：
    | 字段       | 类型   | 必填 | 说明         |
    |------------|--------|------|--------------|
    | name       | string | 是   | 分支名称     |
    | ref        | string | 否   | 源分支/标签  |
    | description| string | 否   | 分支描述     |
- **DELETE** `/gitlab/branches` 删除分支
  - **请求体**（DeleteBranchDto）：
    | 字段 | 类型   | 必填 | 说明     |
    |------|--------|------|----------|
    | name | string | 是   | 分支名称 |
- **响应体**（BranchResponseDto）：见下方DTO结构

### 2. 文件操作
- **POST** `/gitlab/commit` 提交文件
  - **请求体**（CommitFileDto）：
    | 字段          | 类型   | 必填 | 说明               |
    |---------------|--------|------|--------------------|
    | branch        | string | 是   | 分支名称           |
    | filePath      | string | 是   | 文件路径           |
    | commitMessage | string | 是   | 提交信息           |
    | content       | string | 是   | 文件内容（Base64） |
    | lastCommitId  | string | 否   | 上次提交SHA        |
    | autoMerge     | bool   | 否   | 自动合并           |

### 3. 合并请求
- **POST** `/gitlab/merge-requests` 创建合并请求
  - **请求体**（CreateMergeRequestDto）：
    | 字段              | 类型   | 必填 | 说明               |
    |-------------------|--------|------|--------------------|
    | sourceBranch      | string | 是   | 源分支             |
    | targetBranch      | string | 是   | 目标分支           |
    | title             | string | 是   | 合并请求标题       |
    | description       | string | 否   | 合并请求描述       |
    | removeSourceBranch| bool   | 否   | 合并后删除源分支   |
    | squash            | bool   | 否   | 是否压缩提交       |

### 4. 其他
- **GET** `/gitlab/files` 获取文件内容（参数：branch, path）
- **GET** `/gitlab/merge-requests` 获取所有合并请求
- **GET** `/gitlab/merge-requests/:id` 获取合并请求详情
- **POST** `/gitlab/merge-requests/:id/accept` 接受合并请求
- **GET** `/gitlab/logs` 获取操作日志
- **GET** `/gitlab/stats` 获取项目统计信息

#### BranchResponseDto 结构
```ts
{
  branch: {
    name: string;
    protected: boolean;
    default: boolean;
    can_push: boolean;
    commit: {
      id: string;
      short_id: string;
      title: string;
      message: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
      created_at: string;
    };
    merged: boolean;
  };
  creatorNickname?: string;
  lastModifierNickname?: string;
}
```

## 公共方法与拦截器

### 日志拦截器（LoggingInterceptor）

系统内置日志拦截器，自动记录所有 API 请求、响应与错误日志，便于开发调试。

- 请求日志：方法、URL、请求体
- 响应日志：状态码、耗时、响应体
- 错误日志：错误码、详细信息

示例：
```
[API] 🔶 请求 GET /roles
[API] 🔷 响应 GET /roles 200 42ms
[API] 📦 响应体: [...]
```

---

> 下方将继续补充各模块详细 API 说明、DTO 结构、关键用法与最佳实践。如需继续，请告知下一个重点。

## 项目描述

[Nest](https://github.com/nestjs/nest) 框架 TypeScript 启动仓库。

## 项目设置

```bash
$ pnpm install
```

## 数据库初始化

在新环境中部署项目时，需要执行以下步骤来初始化数据库：

### 1. 确保环境变量配置正确

检查 `.env` 文件中的数据库连接配置：

```
DATABASE_URL="mysql://root:aaa123@localhost:3306/panel_machine"

# JWT配置
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"
```

### 2. 创建数据库架构

```bash
$ pnpm prisma migrate dev --name init
```

该命令将根据 `schema.prisma` 文件创建数据库表结构。

### 3. 初始化基础数据

```bash
$ pnpm db:seed
```

执行该命令将：
- 创建基本角色（admin, user）
- 初始化 GitLab 相关权限
- 创建管理员账户
- 为用户分配默认角色

### 4. 默认管理员账户

系统会自动创建以下管理员账户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| chimoo | ****** | 超级管理员 |
| admin | admin123 | 系统管理员 |

这些账户拥有完整的系统管理权限，可以访问所有功能模块。

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

### 角色管理模块

角色管理模块提供了用户角色的管理功能，包括角色的创建、查询、修改和删除，以及角色与用户、权限的关联管理。

#### 功能

- **角色管理**：创建、查询、修改和删除角色
- **角色关联**：管理角色与用户、权限的关联关系
- **权限分配**：为角色分配或移除权限
- **用户分配**：为角色添加或移除用户

#### API 端点

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| GET | `/roles` | 获取所有角色 |
| GET | `/roles/:id` | 获取角色详情 |
| POST | `/roles` | 创建新角色 |
| PATCH | `/roles/:id` | 更新角色信息 |
| DELETE | `/roles/:id` | 删除角色 |
| POST | `/roles/:roleId/permissions/:permissionId` | 添加权限到角色 |
| DELETE | `/roles/:roleId/permissions/:permissionId` | 从角色移除权限 |
| POST | `/roles/:roleId/users/:userId` | 将用户添加到角色 |
| DELETE | `/roles/:roleId/users/:userId` | 从角色移除用户 |

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

## 开发调试

### API 请求和响应日志

系统内置了强大的日志拦截器，可以实时查看前端发送的请求数据和后端返回的响应数据。这对于API调试非常有用，特别是在开发阶段。

日志功能包括：

- **请求日志**：记录所有API请求的方法、URL和请求体
- **响应日志**：记录所有API响应的状态码、响应时间和响应体
- **错误日志**：记录所有API错误，包括错误码和详细错误信息

日志示例：

```
[API] 🔶 请求 GET /roles
[API] 🔷 响应 GET /roles 200 42ms
[API] 📦 响应体:
[
  {
    "id": 1,
    "name": "admin",
    "description": "系统管理员",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "userCount": 2,
    "permissionCount": 15
  }
]

[API] 🔶 请求 POST /users
[API] 📦 请求体:
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "nickname": "新用户"
}
[API] 🔷 响应 POST /users 201 105ms
```

这些日志在开发过程中会自动在控制台中显示，无需额外配置。

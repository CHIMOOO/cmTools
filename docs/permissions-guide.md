# 前端权限配置指南

## 权限模型概述

系统采用基于模块的权限控制模型，每个模块都有对应的权限码。用户通过角色获取权限，一个用户可以拥有多个角色，一个角色可以拥有多个权限。

## 模块级别权限码表

| 权限码 | 名称 | 描述 |
|-------|------|------|
| user:manage | 用户管理 | 用户管理模块权限，包括用户创建、查询、修改和删除 |
| role:manage | 角色管理 | 角色管理模块权限，包括角色创建、查询、修改和删除 |
| permission:manage | 权限配置 | 权限配置模块权限，包括权限分配和查询 |
| dashboard:access | 控制面板 | 控制面板访问权限，包括系统监控和统计信息查看 |
| ipc:manage | IPC配置 | IPC配置模块权限，包括IPC配置的创建、修改和删除 |
| panel:manage | 面板机配置 | 面板机配置模块权限，包括面板机配置的创建、修改和删除 |
| f8000:manage | F8000配置 | F8000配置模块权限，包括F8000配置的创建、修改和删除 |

## GitLab权限说明

对于GitLab相关操作，系统采用以下规则：
- 拥有`ipc:manage`、`panel:manage`或`f8000:manage`任一权限的用户，默认具有操作GitLab的权限
- 无需单独配置GitLab权限

## 前端获取用户权限的方法

### 方法一：通过用户个人信息获取（推荐）

```javascript
// 使用axios或其他HTTP客户端
const getUserPermissions = async () => {
  try {
    // 获取用户信息，包括角色
    const { data: userInfo } = await axios.get('/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}` // 用户登录后获取的JWT令牌
      }
    });
    
    // 提取用户角色
    const userRoles = userInfo.roles || [];
    
    // 获取每个角色的权限
    let userPermissions = [];
    for (const role of userRoles) {
      const { data: roleDetail } = await axios.get(`/roles/${role.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // 合并权限
      const rolePermissions = roleDetail.permissions || [];
      userPermissions = [...userPermissions, ...rolePermissions];
    }
    
    // 去重处理
    const uniquePermissions = [...new Set(userPermissions.map(p => p.code))];
    return uniquePermissions;
  } catch (error) {
    console.error('获取用户权限失败', error);
    return [];
  }
};
```

### 方法二：通过角色直接判断（简化方法）

对于某些场景，可以直接根据角色名称判断权限：

```javascript
const getUserRoleNames = () => {
  // 从JWT中获取角色信息
  const token = localStorage.getItem('token');
  const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : {};
  return tokenData.roles || [];
};

const isAdmin = () => {
  const roleNames = getUserRoleNames();
  return roleNames.includes('admin');
};

// 管理员拥有所有权限
if (isAdmin()) {
  // 显示所有管理功能
}
```

## 前端权限检查示例

```javascript
// 权限检查工具函数
const hasPermission = (permissionCode, userPermissions) => {
  // 如果用户是管理员，默认拥有所有权限
  if (getUserRoleNames().includes('admin')) return true;
  
  // 判断用户是否有指定权限
  return userPermissions.includes(permissionCode);
};

// 检查用户是否有IPC配置权限
const canManageIPC = (userPermissions) => {
  return hasPermission('ipc:manage', userPermissions);
};

// 检查用户是否可以操作GitLab
const canOperateGitlab = (userPermissions) => {
  return hasPermission('ipc:manage', userPermissions) || 
         hasPermission('panel:manage', userPermissions) || 
         hasPermission('f8000:manage', userPermissions);
};
```

## 在Vue组件中使用

```vue
<template>
  <div>
    <!-- 根据权限显示或隐藏组件 -->
    <div v-if="canManageUsers">
      <h2>用户管理</h2>
      <!-- 用户管理相关内容 -->
    </div>
    
    <div v-if="canManageIPC">
      <h2>IPC配置</h2>
      <!-- IPC配置相关内容 -->
    </div>
    
    <div v-if="canOperateGitlab">
      <button @click="createBranch">创建分支</button>
      <button @click="commitChanges">提交修改</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const userPermissions = ref([]);

onMounted(async () => {
  // 获取用户权限
  userPermissions.value = await getUserPermissions();
});

// 计算属性：判断用户是否有各种权限
const canManageUsers = computed(() => {
  return hasPermission('user:manage', userPermissions.value);
});

const canManageIPC = computed(() => {
  return hasPermission('ipc:manage', userPermissions.value);
});

const canOperateGitlab = computed(() => {
  return hasPermission('ipc:manage', userPermissions.value) || 
         hasPermission('panel:manage', userPermissions.value) || 
         hasPermission('f8000:manage', userPermissions.value);
});

// 方法定义
const createBranch = async () => {
  if (!canOperateGitlab.value) return;
  // GitLab创建分支逻辑...
};

const commitChanges = async () => {
  if (!canOperateGitlab.value) return;
  // GitLab提交更改逻辑...
};
</script>
```

## 注意事项

1. 前端的权限控制仅作为UI层面的优化，关键的权限控制应该在后端实现
2. 一个用户可能具有多个角色，获取权限时需要合并所有角色的权限
3. 管理员角色（admin）默认拥有所有权限
4. 对于GitLab操作，只要用户拥有`ipc:manage`、`panel:manage`或`f8000:manage`任一权限，都应允许操作GitLab
5. 当用户权限变更时，需要重新获取权限信息或要求用户重新登录 
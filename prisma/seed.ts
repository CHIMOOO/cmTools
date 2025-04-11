import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始执行数据库种子脚本...');

  // 初始化角色
  await initRoles();
  
  // 初始化权限
  await initPermissions();
  
  // 关联角色和权限
  await linkRolePermissions();
  
  // 创建默认管理员账户（如果不存在）
  await createDefaultAdmin();
  
  // 创建指定的超级管理员账户
  await createSuperAdmin('chimoo', 'aaa123..', '超级管理员');
  
  // 为所有用户分配默认角色
  await assignDefaultRoles();
  
  console.log('数据库种子脚本执行完成');
}

async function initRoles() {
  console.log('初始化角色...');
  
  const roles = [
    { name: 'admin', description: '系统管理员' },
    { name: 'user', description: '普通用户' }
  ];
  
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  
  console.log('角色初始化完成');
}

async function initPermissions() {
  console.log('初始化权限...');
  
  const permissions = [
    { name: '用户管理', code: 'user:manage', description: '用户管理模块权限，包括用户创建、查询、修改和删除' },
    { name: '角色管理', code: 'role:manage', description: '角色管理模块权限，包括角色创建、查询、修改和删除' },
    { name: '权限配置', code: 'permission:manage', description: '权限配置模块权限，包括权限分配和查询' },
    { name: '控制面板', code: 'dashboard:access', description: '控制面板访问权限，包括系统监控和统计信息查看' },
    { name: 'IPC配置', code: 'ipc:manage', description: 'IPC配置模块权限，包括IPC配置的创建、修改和删除' },
    { name: '面板机配置', code: 'panel:manage', description: '面板机配置模块权限，包括面板机配置的创建、修改和删除' },
    { name: 'F8000配置', code: 'f8000:manage', description: 'F8000配置模块权限，包括F8000配置的创建、修改和删除' }
  ];
  
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { 
        name: permission.name,
        description: permission.description 
      },
      create: permission,
    });
  }
  
  console.log('权限初始化完成');
}

async function linkRolePermissions() {
  console.log('关联角色和权限...');
  
  // 获取角色
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  
  if (!adminRole || !userRole) {
    console.error('未找到必要的角色，无法完成关联');
    return;
  }
  
  // 获取所有权限
  const allPermissions = await prisma.permission.findMany();
  
  if (allPermissions.length === 0) {
    console.error('未找到权限，无法完成关联');
    return;
  }
  
  // 清除现有权限关联
  await prisma.$executeRaw`DELETE FROM role_permissions WHERE role_id = ${adminRole.id}`;
  await prisma.$executeRaw`DELETE FROM role_permissions WHERE role_id = ${userRole.id}`;
  
  // 为管理员添加所有权限
  for (const permission of allPermissions) {
    try {
      await prisma.$executeRaw`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        VALUES (${adminRole.id}, ${permission.id}, NOW())
      `;
    } catch (error) {
      console.log(`为管理员角色添加权限 ${permission.code} 时出错：`, error.message);
    }
  }
  
  // 为普通用户添加部分权限
  const userPermissionCodes = ['dashboard:access', 'ipc:manage', 'panel:manage', 'f8000:manage'];
  const userPermissions = allPermissions.filter(p => userPermissionCodes.includes(p.code));
  
  for (const permission of userPermissions) {
    try {
      await prisma.$executeRaw`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        VALUES (${userRole.id}, ${permission.id}, NOW())
      `;
    } catch (error) {
      console.log(`为用户角色添加权限 ${permission.code} 时出错：`, error.message);
    }
  }
  
  console.log(`已为admin角色分配 ${allPermissions.length} 个权限`);
  console.log(`已为user角色分配 ${userPermissions.length} 个权限`);
  console.log('角色权限关联完成');
}

async function createDefaultAdmin() {
  console.log('检查默认管理员账户...');
  
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  
  if (!adminExists) {
    // 获取admin角色
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    
    if (!adminRole) {
      console.error('未找到admin角色，无法创建默认管理员');
      return;
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // 创建管理员账户
    const newAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nickname: '系统管理员',
        isActive: true,
      }
    });
    
    // 关联角色
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES (${newAdmin.id}, ${adminRole.id}, NOW())
    `;
    
    console.log('已创建默认管理员账户：admin / admin123');
  } else {
    console.log('默认管理员账户已存在');
  }
}

async function createSuperAdmin(username: string, password: string, nickname: string) {
  console.log(`检查超级管理员账户 ${username}...`);
  
  const adminExists = await prisma.user.findUnique({ where: { username } });
  
  if (!adminExists) {
    // 获取admin角色
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    
    if (!adminRole) {
      console.error('未找到admin角色，无法创建超级管理员');
      return;
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建管理员账户
    const newAdmin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname,
        isActive: true,
      }
    });
    
    // 关联角色
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES (${newAdmin.id}, ${adminRole.id}, NOW())
    `;
    
    console.log(`已创建超级管理员账户：${username}`);
  } else {
    console.log(`超级管理员账户 ${username} 已存在`);
  }
}

async function assignDefaultRoles() {
  console.log('为没有角色的用户分配默认角色...');
  
  // 获取user角色
  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  
  if (!userRole) {
    console.error('未找到user角色，无法分配默认角色');
    return;
  }
  
  // 查找没有角色关联的用户
  const usersWithoutRoles = await prisma.$queryRaw`
    SELECT u.id FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.user_id IS NULL
  ` as { id: number }[];
  
  if (Array.isArray(usersWithoutRoles) && usersWithoutRoles.length === 0) {
    console.log('所有用户已有角色分配');
    return;
  }
  
  // 为这些用户分配默认用户角色
  let count = 0;
  for (const userObj of usersWithoutRoles) {
    const userId = userObj.id;
    try {
      await prisma.$executeRaw`
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (${userId}, ${userRole.id}, NOW())
      `;
      count++;
    } catch (error) {
      console.error(`为用户 ${userId} 分配角色时出错:`, error.message);
    }
  }
  
  console.log(`已为 ${count} 个用户分配默认角色`);
}

main()
  .catch((e) => {
    console.error('数据库种子脚本执行失败', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
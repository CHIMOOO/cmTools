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
    { name: 'GitLab查看分支', code: 'gitlab:branches:read', description: 'GitLab查看分支列表权限' },
    { name: 'GitLab创建分支', code: 'gitlab:branches:create', description: 'GitLab创建分支权限' },
    { name: 'GitLab删除分支', code: 'gitlab:branches:delete', description: 'GitLab删除分支权限' },
    { name: 'GitLab提交文件', code: 'gitlab:files:commit', description: 'GitLab提交文件权限' },
    { name: 'GitLab读取文件', code: 'gitlab:files:read', description: 'GitLab读取文件内容权限' },
    { name: 'GitLab管理合并请求', code: 'gitlab:merge:manage', description: 'GitLab管理合并请求权限' },
    { name: 'GitLab查看日志', code: 'gitlab:logs:read', description: 'GitLab查看操作日志权限' },
    { name: 'GitLab查看统计', code: 'gitlab:stats:read', description: 'GitLab查看项目统计信息权限' }
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
  const allPermissions = await prisma.permission.findMany({
    where: { code: { startsWith: 'gitlab:' } }
  });
  
  if (allPermissions.length === 0) {
    console.error('未找到GitLab相关权限，无法完成关联');
    return;
  }
  
  // 为管理员添加所有权限
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  });
  
  // 为普通用户添加除了删除分支外的所有权限
  const userPermissions = allPermissions.filter(p => p.code !== 'gitlab:branches:delete');
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        connect: userPermissions.map(p => ({ id: p.id }))
      }
    }
  });
  
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
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nickname: '系统管理员',
        isActive: true,
        roles: {
          connect: { id: adminRole.id }
        }
      }
    });
    
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
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname,
        isActive: true,
        roles: {
          connect: { id: adminRole.id }
        }
      }
    });
    
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
  
  // 获取所有没有角色的用户
  const usersWithoutRoles = await prisma.user.findMany({
    where: {
      roles: {
        none: {}
      }
    }
  });
  
  if (usersWithoutRoles.length === 0) {
    console.log('所有用户已有角色分配');
    return;
  }
  
  // 为这些用户分配默认用户角色
  for (const user of usersWithoutRoles) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          connect: { id: userRole.id }
        }
      }
    });
  }
  
  console.log(`已为 ${usersWithoutRoles.length} 个用户分配默认角色`);
}

main()
  .catch((e) => {
    console.error('数据库种子脚本执行失败', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
-- 角色初始化
INSERT INTO roles (name, description) 
VALUES 
('admin', '系统管理员'),
('user', '普通用户')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 权限初始化
INSERT INTO permissions (name, code, description) 
VALUES 
-- GitLab 相关权限
('GitLab查看分支', 'gitlab:branches:read', 'GitLab查看分支列表权限'),
('GitLab创建分支', 'gitlab:branches:create', 'GitLab创建分支权限'),
('GitLab删除分支', 'gitlab:branches:delete', 'GitLab删除分支权限'),
('GitLab提交文件', 'gitlab:files:commit', 'GitLab提交文件权限'),
('GitLab读取文件', 'gitlab:files:read', 'GitLab读取文件内容权限'),
('GitLab管理合并请求', 'gitlab:merge:manage', 'GitLab管理合并请求权限'),
('GitLab查看日志', 'gitlab:logs:read', 'GitLab查看操作日志权限'),
('GitLab查看统计', 'gitlab:stats:read', 'GitLab查看项目统计信息权限')
ON DUPLICATE KEY UPDATE 
  description = VALUES(description);

-- 角色权限关联
-- 获取角色ID
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin');
SET @user_role_id = (SELECT id FROM roles WHERE name = 'user');

-- 获取权限ID
SET @gitlab_branches_read_id = (SELECT id FROM permissions WHERE code = 'gitlab:branches:read');
SET @gitlab_branches_create_id = (SELECT id FROM permissions WHERE code = 'gitlab:branches:create');
SET @gitlab_branches_delete_id = (SELECT id FROM permissions WHERE code = 'gitlab:branches:delete');
SET @gitlab_files_commit_id = (SELECT id FROM permissions WHERE code = 'gitlab:files:commit');
SET @gitlab_files_read_id = (SELECT id FROM permissions WHERE code = 'gitlab:files:read');
SET @gitlab_merge_manage_id = (SELECT id FROM permissions WHERE code = 'gitlab:merge:manage');
SET @gitlab_logs_read_id = (SELECT id FROM permissions WHERE code = 'gitlab:logs:read');
SET @gitlab_stats_read_id = (SELECT id FROM permissions WHERE code = 'gitlab:stats:read');

-- 为管理员角色添加所有GitLab权限
INSERT INTO _RolePermissions (A, B) 
VALUES 
(@admin_role_id, @gitlab_branches_read_id),
(@admin_role_id, @gitlab_branches_create_id),
(@admin_role_id, @gitlab_branches_delete_id),
(@admin_role_id, @gitlab_files_commit_id),
(@admin_role_id, @gitlab_files_read_id),
(@admin_role_id, @gitlab_merge_manage_id),
(@admin_role_id, @gitlab_logs_read_id),
(@admin_role_id, @gitlab_stats_read_id)
ON DUPLICATE KEY UPDATE A = VALUES(A);

-- 为普通用户角色添加基本GitLab权限
INSERT INTO _RolePermissions (A, B) 
VALUES 
(@user_role_id, @gitlab_branches_read_id),
(@user_role_id, @gitlab_branches_create_id),
(@user_role_id, @gitlab_files_commit_id),
(@user_role_id, @gitlab_files_read_id),
(@user_role_id, @gitlab_merge_manage_id),
(@user_role_id, @gitlab_logs_read_id),
(@user_role_id, @gitlab_stats_read_id)
ON DUPLICATE KEY UPDATE A = VALUES(A);

-- 确保所有用户至少有一个角色（为没有角色的用户分配user角色）
INSERT INTO _UserRoles (A, B)
SELECT u.id, @user_role_id
FROM users u
LEFT JOIN _UserRoles ur ON u.id = ur.A
WHERE ur.A IS NULL; 
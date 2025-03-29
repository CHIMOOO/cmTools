-- CreateTable
CREATE TABLE `gitlab_operation_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `branch_name` VARCHAR(191) NULL,
    `commit_message` VARCHAR(191) NULL,
    `commit_sha` VARCHAR(191) NULL,
    `file_path` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `error_message` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gitlab_operation_logs` ADD CONSTRAINT `gitlab_operation_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to alter the column `role` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Message` MODIFY `role` ENUM('USER', 'ASSISTANT') NOT NULL;

/*
  Warnings:

  - You are about to drop the column `authorId` on the `Notion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Notion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Notion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notion" DROP CONSTRAINT "Notion_authorId_fkey";

-- AlterTable
ALTER TABLE "Notion" DROP COLUMN "authorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Notion_userId_key" ON "Notion"("userId");

-- AddForeignKey
ALTER TABLE "Notion" ADD CONSTRAINT "Notion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

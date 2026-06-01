-- CreateTable
CREATE TABLE "_ServerToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CustomerToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ServerToTag_AB_unique" ON "_ServerToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ServerToTag_B_index" ON "_ServerToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerToTag_AB_unique" ON "_CustomerToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerToTag_B_index" ON "_CustomerToTag"("B");

-- AddForeignKey
ALTER TABLE "_ServerToTag" ADD CONSTRAINT "_ServerToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServerToTag" ADD CONSTRAINT "_ServerToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToTag" ADD CONSTRAINT "_CustomerToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToTag" ADD CONSTRAINT "_CustomerToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

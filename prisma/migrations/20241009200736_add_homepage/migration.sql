-- CreateTable
CREATE TABLE "HomePage" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "homepageImageId" TEXT NOT NULL,

    CONSTRAINT "HomePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageImage" (
    "id" TEXT NOT NULL,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "homepageId" TEXT NOT NULL,

    CONSTRAINT "HomepageImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageImage_homepageId_key" ON "HomepageImage"("homepageId");

-- AddForeignKey
ALTER TABLE "HomepageImage" ADD CONSTRAINT "HomepageImage_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "HomePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

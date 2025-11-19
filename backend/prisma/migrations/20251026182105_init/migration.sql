-- CreateTable
CREATE TABLE "IndexerCursor" (
    "eventType" TEXT NOT NULL,
    "lastVersion" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerCursor_pkey" PRIMARY KEY ("eventType")
);

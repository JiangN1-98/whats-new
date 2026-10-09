CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "externalAuthId" TEXT,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");

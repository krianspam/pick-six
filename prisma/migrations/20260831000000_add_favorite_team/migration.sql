-- Add favorite-team tracking to User
ALTER TABLE "User" ADD COLUMN "favoriteTeamId" TEXT;
ALTER TABLE "User" ADD COLUMN "phase" TEXT;
ALTER TABLE "User" ADD COLUMN "switchedAt" TIMESTAMP(3);

CREATE INDEX "User_favoriteTeamId_idx" ON "User"("favoriteTeamId");

ALTER TABLE "User" ADD CONSTRAINT "User_favoriteTeamId_fkey"
  FOREIGN KEY ("favoriteTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

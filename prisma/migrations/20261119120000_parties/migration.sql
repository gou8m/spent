-- People & shops preferences (merge, mute, pin, person/shop override). Purely additive.
CREATE TABLE "Party" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "kind" TEXT,
  "mergedIntoKey" TEXT,
  "muted" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Party_userId_key_key" ON "Party"("userId", "key");
CREATE INDEX "Party_userId_idx" ON "Party"("userId");

ALTER TABLE "Party" ADD CONSTRAINT "Party_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

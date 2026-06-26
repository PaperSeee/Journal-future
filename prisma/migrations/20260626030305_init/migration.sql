-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('MNQ', 'MGC', 'OTHER');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "PoiType" AS ENUM ('IMBALANCE', 'GAP', 'DEVIL_MARK');

-- CreateEnum
CREATE TYPE "PoiSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "Reaction" AS ENUM ('CLEAN', 'WEAK', 'FORCED');

-- CreateEnum
CREATE TYPE "Result" AS ENUM ('WIN', 'LOSS', 'BE');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('OVERNIGHT', 'LONDON', 'NY', 'POST_NY');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('CALM', 'CONFIDENT', 'NEUTRAL', 'FOMO', 'ANXIOUS', 'REVENGE', 'TILTED', 'HESITANT');

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "direction" "Direction" NOT NULL,
    "htfBias" TEXT NOT NULL,
    "entryPoiType" "PoiType" NOT NULL,
    "entryPoi" TEXT NOT NULL,
    "targetZone" TEXT NOT NULL,
    "tapTimeUtc" TEXT,
    "session" "Session",
    "poiSize" "PoiSize" NOT NULL,
    "reactionQuality" "Reaction" NOT NULL,
    "noWick" BOOLEAN NOT NULL DEFAULT false,
    "entryPrice" DOUBLE PRECISION,
    "stopPrice" DOUBLE PRECISION,
    "targetPrice" DOUBLE PRECISION,
    "rrPlanned" DOUBLE PRECISION,
    "result" "Result" NOT NULL,
    "rRealized" DOUBLE PRECISION,
    "followedPlan" BOOLEAN NOT NULL DEFAULT true,
    "sentimentPre" "Sentiment",
    "sentimentPost" "Sentiment",
    "note" TEXT,
    "screenshotUrl" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_date_idx" ON "Trade"("date");

-- CreateIndex
CREATE INDEX "Trade_instrument_idx" ON "Trade"("instrument");

-- CreateIndex
CREATE INDEX "Trade_session_idx" ON "Trade"("session");

-- CreateIndex
CREATE INDEX "Trade_result_idx" ON "Trade"("result");

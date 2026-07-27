-- CreateEnum
CREATE TYPE "Strategy" AS ENUM ('HTF_IMBALANCE', 'IB');

-- CreateEnum
CREATE TYPE "IbSession" AS ENUM ('ASIA', 'LONDON', 'NEW_YORK');

-- CreateEnum
CREATE TYPE "IbDirection" AS ENUM ('BULLISH', 'BEARISH');

-- CreateEnum
CREATE TYPE "IbEntryTiming" AS ENUM ('BEFORE_IB_CLOSE', 'AFTER_IB_CLOSE');

-- CreateEnum
CREATE TYPE "IbFvg" AS ENUM ('NONE', 'M5', 'M15');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "ibDirection" "IbDirection",
ADD COLUMN     "ibEntryTiming" "IbEntryTiming",
ADD COLUMN     "ibFvg" "IbFvg",
ADD COLUMN     "ibSession" "IbSession",
ADD COLUMN     "strategy" "Strategy" NOT NULL DEFAULT 'HTF_IMBALANCE',
ALTER COLUMN "htfBias" DROP NOT NULL,
ALTER COLUMN "entryPoiType" DROP NOT NULL,
ALTER COLUMN "entryPoi" DROP NOT NULL,
ALTER COLUMN "targetZone" DROP NOT NULL,
ALTER COLUMN "poiSize" DROP NOT NULL,
ALTER COLUMN "reactionQuality" DROP NOT NULL;

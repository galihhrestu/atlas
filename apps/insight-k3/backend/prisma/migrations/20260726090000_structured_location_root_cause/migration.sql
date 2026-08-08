-- AlterTable
ALTER TABLE "incidents"
ADD COLUMN "estate" VARCHAR(50),
ADD COLUMN "location_type" VARCHAR(50),
ADD COLUMN "block" VARCHAR(10),
ADD COLUMN "compartment" VARCHAR(20),
ADD COLUMN "hauling_road" VARCHAR(150),
ADD COLUMN "compartment_road" VARCHAR(100),
ADD COLUMN "location_detail" VARCHAR(255),
ADD COLUMN "root_cause_category" VARCHAR(150);

-- CreateIndex
CREATE INDEX "incidents_estate_idx" ON "incidents"("estate");

-- CreateIndex
CREATE INDEX "incidents_location_type_idx" ON "incidents"("location_type");

-- CreateIndex
CREATE INDEX "incidents_block_compartment_idx" ON "incidents"("block", "compartment");

-- CreateTable
CREATE TABLE "reorder_rules" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "min_qty" DECIMAL(20,6) NOT NULL,
    "max_qty" DECIMAL(20,6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reorder_rules_product_id_key" ON "reorder_rules"("product_id");

-- CreateIndex
CREATE INDEX "reorder_rules_is_active_product_id_idx" ON "reorder_rules"("is_active", "product_id");

-- AddForeignKey
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

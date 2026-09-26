import bcrypt from "bcryptjs";
import {
  PrismaClient,
  StockMovementType,
  UserRole,
  OperationStatus,
  OperationType,
} from "@prisma/client";

const directDatabaseUrl = process.env.DATABASE_URL_UNPOOLED;
const bootstrapPassword = process.env.BOOTSTRAP_MANAGER_PASSWORD;

if (!directDatabaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED is required to run the seed.");
}

if (!bootstrapPassword) {
  throw new Error("BOOTSTRAP_MANAGER_PASSWORD is required to run the seed.");
}

const password: string = bootstrapPassword;

// Seed and migration operations should use Neon's direct connection. The
// application can continue using the pooled DATABASE_URL at runtime.
process.env.DATABASE_URL = directDatabaseUrl;

const prisma = new PrismaClient();

async function main() {
  const passwordHash: string = (await bcrypt.hash(password, 12)) as string;
  const testPasswordHash: string = (await bcrypt.hash("TestPassword123!", 12)) as string;
  const usedOtpHash: string = (await bcrypt.hash("000000", 12)) as string;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const manager = await tx.user.upsert({
      where: { email: "admin@admin.com" },
      update: {
        username: "admin",
        passwordHash,
        role: UserRole.MANAGER,
      },
      create: {
        username: "admin",
        email: "admin@admin.com",
        passwordHash,
        role: UserRole.MANAGER,
      },
    });

    const warehouseNorth = await tx.warehouse.upsert({
      where: { code: "WH-NORTH" },
      update: { name: "North Distribution Center", address: "12 Market Street" },
      create: {
        name: "North Distribution Center",
        code: "WH-NORTH",
        address: "12 Market Street",
      },
    });

    const warehouseSouth = await tx.warehouse.upsert({
      where: { code: "WH-SOUTH" },
      update: { name: "South Distribution Center", address: "88 Harbour Road" },
      create: {
        name: "South Distribution Center",
        code: "WH-SOUTH",
        address: "88 Harbour Road",
      },
    });

    const staffNorth = await tx.user.upsert({
      where: { email: "staff.north@stocksense.test" },
      update: {
        username: "staff_north",
        passwordHash: testPasswordHash,
        role: UserRole.STAFF,
        warehouseId: warehouseNorth.id,
      },
      create: {
        username: "staff_north",
        email: "staff.north@stocksense.test",
        passwordHash: testPasswordHash,
        role: UserRole.STAFF,
        warehouseId: warehouseNorth.id,
      },
    });

    const staffSouth = await tx.user.upsert({
      where: { email: "staff.south@stocksense.test" },
      update: {
        username: "staff_south",
        passwordHash: testPasswordHash,
        role: UserRole.STAFF,
        warehouseId: warehouseSouth.id,
      },
      create: {
        username: "staff_south",
        email: "staff.south@stocksense.test",
        passwordHash: testPasswordHash,
        role: UserRole.STAFF,
        warehouseId: warehouseSouth.id,
      },
    });

    const northReceiving = await tx.location.upsert({
      where: {
        warehouseId_code: { warehouseId: warehouseNorth.id, code: "RECEIVING" },
      },
      update: { name: "Receiving" },
      create: { warehouseId: warehouseNorth.id, name: "Receiving", code: "RECEIVING" },
    });
    const northStorage = await tx.location.upsert({
      where: {
        warehouseId_code: { warehouseId: warehouseNorth.id, code: "STORAGE" },
      },
      update: { name: "Main Storage" },
      create: { warehouseId: warehouseNorth.id, name: "Main Storage", code: "STORAGE" },
    });
    await tx.location.upsert({
      where: {
        warehouseId_code: { warehouseId: warehouseSouth.id, code: "RECEIVING" },
      },
      update: { name: "Receiving" },
      create: { warehouseId: warehouseSouth.id, name: "Receiving", code: "RECEIVING" },
    });
    const southStorage = await tx.location.upsert({
      where: {
        warehouseId_code: { warehouseId: warehouseSouth.id, code: "STORAGE" },
      },
      update: { name: "Main Storage" },
      create: { warehouseId: warehouseSouth.id, name: "Main Storage", code: "STORAGE" },
    });

    const electronics = await tx.category.upsert({
      where: { name: "Electronics" },
      update: {},
      create: { name: "Electronics" },
    });
    const packaging = await tx.category.upsert({
      where: { name: "Packaging" },
      update: {},
      create: { name: "Packaging" },
    });
    const consumables = await tx.category.upsert({
      where: { name: "Consumables" },
      update: {},
      create: { name: "Consumables" },
    });

    const laptop = await tx.product.upsert({
      where: { sku: "ELEC-LAP-001" },
      update: { name: "Warehouse Laptop", categoryId: electronics.id, uom: "pcs", unitCost: "850", reorderPoint: "5" },
      create: { name: "Warehouse Laptop", sku: "ELEC-LAP-001", categoryId: electronics.id, uom: "pcs", unitCost: "850", reorderPoint: "5" },
    });
    const scanner = await tx.product.upsert({
      where: { sku: "ELEC-SCN-001" },
      update: { name: "Barcode Scanner", categoryId: electronics.id, uom: "pcs", unitCost: "120", reorderPoint: "10" },
      create: { name: "Barcode Scanner", sku: "ELEC-SCN-001", categoryId: electronics.id, uom: "pcs", unitCost: "120", reorderPoint: "10" },
    });
    const boxes = await tx.product.upsert({
      where: { sku: "PACK-BOX-001" },
      update: { name: "Shipping Box", categoryId: packaging.id, uom: "pcs", unitCost: "2.5", reorderPoint: "100" },
      create: { name: "Shipping Box", sku: "PACK-BOX-001", categoryId: packaging.id, uom: "pcs", unitCost: "2.5", reorderPoint: "100" },
    });
    const labels = await tx.product.upsert({
      where: { sku: "PACK-LBL-001" },
      update: { name: "Shipping Label Roll", categoryId: packaging.id, uom: "roll", unitCost: "15", reorderPoint: "20" },
      create: { name: "Shipping Label Roll", sku: "PACK-LBL-001", categoryId: packaging.id, uom: "roll", unitCost: "15", reorderPoint: "20" },
    });
    const gloves = await tx.product.upsert({
      where: { sku: "CONS-GLV-001" },
      update: { name: "Safety Gloves", categoryId: consumables.id, uom: "pair", unitCost: "4.5", reorderPoint: "25" },
      create: { name: "Safety Gloves", sku: "CONS-GLV-001", categoryId: consumables.id, uom: "pair", unitCost: "4.5", reorderPoint: "25" },
    });

    await tx.stockBalance.upsert({
      where: { productId_locationId: { productId: laptop.id, locationId: northStorage.id } },
      update: { onHandQty: "18", reservedQty: "2" },
      create: { productId: laptop.id, locationId: northStorage.id, onHandQty: "18", reservedQty: "2" },
    });
    await tx.stockBalance.upsert({
      where: { productId_locationId: { productId: scanner.id, locationId: northStorage.id } },
      update: { onHandQty: "42", reservedQty: "4" },
      create: { productId: scanner.id, locationId: northStorage.id, onHandQty: "42", reservedQty: "4" },
    });
    await tx.stockBalance.upsert({
      where: { productId_locationId: { productId: boxes.id, locationId: northStorage.id } },
      update: { onHandQty: "320", reservedQty: "40" },
      create: { productId: boxes.id, locationId: northStorage.id, onHandQty: "320", reservedQty: "40" },
    });
    await tx.stockBalance.upsert({
      where: { productId_locationId: { productId: labels.id, locationId: southStorage.id } },
      update: { onHandQty: "75", reservedQty: "10" },
      create: { productId: labels.id, locationId: southStorage.id, onHandQty: "75", reservedQty: "10" },
    });
    await tx.stockBalance.upsert({
      where: { productId_locationId: { productId: gloves.id, locationId: southStorage.id } },
      update: { onHandQty: "160", reservedQty: "15" },
      create: { productId: gloves.id, locationId: southStorage.id, onHandQty: "160", reservedQty: "15" },
    });

    const receipt = await tx.inventoryOperation.upsert({
      where: { reference: "WHN-REC-0001" },
      update: {
        type: OperationType.RECEIPT,
        status: OperationStatus.DONE,
        warehouseId: warehouseNorth.id,
        toLocationId: northStorage.id,
        contactName: "Acme Supplies",
        address: "1 Supplier Avenue",
        scheduledDate: new Date("2026-09-20T09:00:00Z"),
        responsibleUserId: staffNorth.id,
        validatedAt: new Date("2026-09-20T10:15:00Z"),
      },
      create: {
        reference: "WHN-REC-0001",
        type: OperationType.RECEIPT,
        status: OperationStatus.DONE,
        warehouseId: warehouseNorth.id,
        toLocationId: northStorage.id,
        contactName: "Acme Supplies",
        address: "1 Supplier Avenue",
        scheduledDate: new Date("2026-09-20T09:00:00Z"),
        responsibleUserId: staffNorth.id,
        validatedAt: new Date("2026-09-20T10:15:00Z"),
      },
    });
    const delivery = await tx.inventoryOperation.upsert({
      where: { reference: "WHS-DEL-0001" },
      update: {
        type: OperationType.DELIVERY,
        status: OperationStatus.DONE,
        warehouseId: warehouseSouth.id,
        fromLocationId: southStorage.id,
        contactName: "Retail Outlet 7",
        address: "7 Commerce Lane",
        scheduledDate: new Date("2026-09-22T14:00:00Z"),
        responsibleUserId: staffSouth.id,
        validatedAt: new Date("2026-09-22T15:30:00Z"),
      },
      create: {
        reference: "WHS-DEL-0001",
        type: OperationType.DELIVERY,
        status: OperationStatus.DONE,
        warehouseId: warehouseSouth.id,
        fromLocationId: southStorage.id,
        contactName: "Retail Outlet 7",
        address: "7 Commerce Lane",
        scheduledDate: new Date("2026-09-22T14:00:00Z"),
        responsibleUserId: staffSouth.id,
        validatedAt: new Date("2026-09-22T15:30:00Z"),
      },
    });
    const transfer = await tx.inventoryOperation.upsert({
      where: { reference: "TRF-0001" },
      update: {
        type: OperationType.TRANSFER,
        status: OperationStatus.READY,
        warehouseId: warehouseNorth.id,
        fromLocationId: northStorage.id,
        toLocationId: northReceiving.id,
        responsibleUserId: manager.id,
      },
      create: {
        reference: "TRF-0001",
        type: OperationType.TRANSFER,
        status: OperationStatus.READY,
        warehouseId: warehouseNorth.id,
        fromLocationId: northStorage.id,
        toLocationId: northReceiving.id,
        responsibleUserId: manager.id,
      },
    });

    const receiptItem = await tx.inventoryOperationItem.upsert({
      where: { operationId_productId: { operationId: receipt.id, productId: scanner.id } },
      update: { quantity: "50", countedQuantity: "50" },
      create: { operationId: receipt.id, productId: scanner.id, quantity: "50", countedQuantity: "50" },
    });
    const deliveryItem = await tx.inventoryOperationItem.upsert({
      where: { operationId_productId: { operationId: delivery.id, productId: gloves.id } },
      update: { quantity: "20", countedQuantity: "20" },
      create: { operationId: delivery.id, productId: gloves.id, quantity: "20", countedQuantity: "20" },
    });
    await tx.inventoryOperationItem.upsert({
      where: { operationId_productId: { operationId: transfer.id, productId: boxes.id } },
      update: { quantity: "30", countedQuantity: null },
      create: { operationId: transfer.id, productId: boxes.id, quantity: "30" },
    });

    await tx.stockLedger.upsert({
      where: { id: "00000000-0000-0000-0000-000000000101" },
      update: {
        operationId: receipt.id,
        operationItemId: receiptItem.id,
        productId: scanner.id,
        fromLocationId: null,
        toLocationId: northStorage.id,
        quantity: "50",
        movementType: StockMovementType.RECEIPT,
        performedById: staffNorth.id,
        movedAt: new Date("2026-09-20T10:15:00Z"),
      },
      create: {
        id: "00000000-0000-0000-0000-000000000101",
        operationId: receipt.id,
        operationItemId: receiptItem.id,
        productId: scanner.id,
        toLocationId: northStorage.id,
        quantity: "50",
        movementType: StockMovementType.RECEIPT,
        performedById: staffNorth.id,
        movedAt: new Date("2026-09-20T10:15:00Z"),
      },
    });
    await tx.stockLedger.upsert({
      where: { id: "00000000-0000-0000-0000-000000000102" },
      update: {
        operationId: delivery.id,
        operationItemId: deliveryItem.id,
        productId: gloves.id,
        fromLocationId: southStorage.id,
        toLocationId: null,
        quantity: "20",
        movementType: StockMovementType.DELIVERY,
        performedById: staffSouth.id,
        movedAt: new Date("2026-09-22T15:30:00Z"),
      },
      create: {
        id: "00000000-0000-0000-0000-000000000102",
        operationId: delivery.id,
        operationItemId: deliveryItem.id,
        productId: gloves.id,
        fromLocationId: southStorage.id,
        quantity: "20",
        movementType: StockMovementType.DELIVERY,
        performedById: staffSouth.id,
        movedAt: new Date("2026-09-22T15:30:00Z"),
      },
    });

    await tx.passwordResetOtp.upsert({
      where: { id: "00000000-0000-0000-0000-000000000201" },
      update: {
        userId: staffNorth.id,
        codeHash: usedOtpHash,
        expiresAt: new Date("2026-09-01T00:00:00Z"),
        usedAt: new Date("2026-09-01T00:01:00Z"),
      },
      create: {
        id: "00000000-0000-0000-0000-000000000201",
        userId: staffNorth.id,
        codeHash: usedOtpHash,
        expiresAt: new Date("2026-09-01T00:00:00Z"),
        usedAt: new Date("2026-09-01T00:01:00Z"),
      },
    });

    return {
      manager,
      users: 3,
      warehouses: 2,
      locations: 4,
      categories: 3,
      products: 5,
      stockBalances: 5,
      operations: 3,
      operationItems: 3,
      ledgerEntries: 2,
      passwordResetOtps: 1,
      generatedAt: now,
    };
  });

  console.log(
    `Test data ready: ${result.users} users, ${result.warehouses} warehouses, ` +
      `${result.locations} locations, ${result.categories} categories, ` +
      `${result.products} products, ${result.stockBalances} stock balances, ` +
      `${result.operations} operations, ${result.operationItems} operation items, ` +
      `${result.ledgerEntries} ledger entries, and ${result.passwordResetOtps} ` +
      `password-reset record. Bootstrap manager: ${result.manager.username} ` +
      `(${result.manager.email}) - ${result.manager.role}.`,
  );
}

main()
  .catch((error) => {
    console.error("Bootstrap manager seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

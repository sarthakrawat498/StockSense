import {
  NotFoundError,
  InvalidStatusTransitionError,
} from "@/lib/errors/app-error";
import { InventoryOperationService } from "@/modules/inventory-operation";
import { DeliveryReader } from "./internal/delivery-reader";
import { DeliveryWriter } from "./internal/delivery-writer";
import type {
  CreateDeliveryInput,
  UpdateDeliveryInput,
  DeliveryFilters,
} from "./types";

/**
 * Delivery service — public API for delivery operations.
 */
export class DeliveryService {
  static async list(filters: DeliveryFilters) {
    return DeliveryReader.findMany(filters);
  }

  static async getById(id: string) {
    const delivery = await DeliveryReader.findById(id);
    if (!delivery) {
      throw new NotFoundError("Delivery", id);
    }
    return delivery;
  }

  static async create(input: CreateDeliveryInput) {
    return DeliveryWriter.create(input);
  }

  static async update(id: string, input: UpdateDeliveryInput) {
    const existing = await DeliveryReader.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery", id);
    }
    if (existing.status !== "DRAFT") {
      throw new InvalidStatusTransitionError(
        existing.status,
        "Cannot edit a non-DRAFT delivery",
      );
    }
    return DeliveryWriter.update(id, input);
  }

  static async confirm(id: string, performedById?: string) {
    return InventoryOperationService.confirm(id, performedById);
  }

  static async cancel(id: string) {
    return InventoryOperationService.cancel(id);
  }
}

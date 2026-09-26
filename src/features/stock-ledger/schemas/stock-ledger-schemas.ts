import { z } from "zod";

const uuid = z.string().uuid("Must be a valid UUID");

export const stockLedgerQuerySchema = z.object({
	productId: uuid.optional(),
	warehouseId: uuid.optional(),
	locationId: uuid.optional(),
	operationType: z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]).optional(),
	fromDate: z.coerce.date().optional(),
	toDate: z.coerce.date().optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
}).strict().superRefine((value, context) => {
	if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
		context.addIssue({ code: z.ZodIssueCode.custom, path: ["toDate"], message: "toDate must be on or after fromDate" });
	}
});

export type StockLedgerQueryInput = z.infer<typeof stockLedgerQuerySchema>;
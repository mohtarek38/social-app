import z from "zod";

// MongoDB ObjectId (24 hex characters)
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const paginationQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

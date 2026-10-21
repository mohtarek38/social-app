import z from "zod";
import { objectIdSchema, paginationQuerySchema } from "../common.validator";

export const postIdParamsValidator = {
  params: z.strictObject({
    postId: objectIdSchema,
  }),
};

export const userPostsValidator = {
  params: z.strictObject({
    userId: objectIdSchema,
  }),
  query: paginationQuerySchema,
};

export const updatePostValidator = {
  params: z.strictObject({
    postId: objectIdSchema,
  }),
  body: z
    .strictObject({
      description: z.string().min(1).max(1000).optional(),
      allowComments: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

import z from "zod";
import { objectIdSchema } from "../common.validator";

export const addCommentValidator = {
  body: z.strictObject({
    refId: objectIdSchema,
    onModel: z.enum(["Post", "Comment"]),
    content: z.string().min(1).max(500),
  }),
};

export const updateCommentValidator = {
  params: z.strictObject({
    commentId: objectIdSchema,
  }),
  body: z.strictObject({
    content: z.string().min(1).max(500),
  }),
};

export const commentIdParamsValidator = {
  params: z.strictObject({
    commentId: objectIdSchema,
  }),
};

export const postCommentsValidator = {
  params: z.strictObject({
    postId: objectIdSchema,
  }),
};

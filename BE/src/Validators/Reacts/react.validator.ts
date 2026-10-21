import z from "zod";
import { ReactTypeEnum } from "../../Common/common.barrel";
import { objectIdSchema } from "../common.validator";

export const reactValidator = {
  body: z.strictObject({
    refId: objectIdSchema,
    onModel: z.enum(["Post", "Comment"]),
    type: z.enum(ReactTypeEnum),
  }),
};

export const refIdParamsValidator = {
  params: z.strictObject({
    refId: objectIdSchema,
  }),
};

import { z } from "zod";

import { commonAttributesValidator, imageValidator } from "./common.validator";
import { priceCategoriesValidator } from "./prices.validator";

export const answerValidator = z.object({
  productId: z.string(),
  name: z.string(),
  description: z.string(), // Q: no translations?
  prices: z.array(priceCategoriesValidator),
  type: z.union([z.literal("PRODUCT"), z.literal("MODIFIER")]),
  images: z.array(imageValidator),
  additionalInfo: z.record(z.string().min(1), z.any()),
  questionId: z.string(),
  attributes: commonAttributesValidator.extend({ answerExternalId: z.string() })
});

export const questionValidator = z.object({
  questionId: z.string(),
  externalId: z.string(),
  name: z.string(),
  description: z.string(),
  min: z.number().int(),
  max: z.number().int(),
  additionalInfo: z.record(z.string().min(1), z.any()),
  visible: z.boolean(),
  position: z.number().int(),
  answers: z.array(answerValidator)
});

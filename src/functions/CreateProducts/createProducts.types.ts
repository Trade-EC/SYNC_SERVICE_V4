import { z } from "/opt/nodejs/node_modules/zod";
import { HeadersProps } from "/opt/nodejs/types/common.types";
import { productsValidator } from "/opt/nodejs/validators/requestsLists.validator";

export type Lists = z.infer<typeof productsValidator>;

export interface CreateProductsProps {
  body: Lists;
  headers: HeadersProps;
}

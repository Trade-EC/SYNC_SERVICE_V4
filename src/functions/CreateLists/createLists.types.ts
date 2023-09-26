import { z } from "/opt/nodejs/node_modules/zod";
import { HeadersProps } from "/opt/nodejs/types/common.types";

import { listsValidator } from "../ValidateLists/validateLists.validator";

export type Lists = z.infer<typeof listsValidator>;

export interface CreateListsProps {
  body: Lists;
  headers: HeadersProps;
}

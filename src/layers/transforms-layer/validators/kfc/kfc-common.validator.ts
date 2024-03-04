import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const kfcPreprocessArray = (schema: z.Schema) =>
  z.preprocess(val => {
    if (Array.isArray(val) && val.length === 1 && Array.isArray(val[0])) {
      return [];
    }

    return val;
  }, schema);

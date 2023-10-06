import { z } from "zod";

import { syncScheduleValidator } from "./common.validator";

export const locationValidator = z.object({
  lat: z.number(),
  lng: z.number()
});

export const idValidator = z.object({
  id: z.string()
});

export const accountValidator = z.object({
  id: z.string()
});

export const cityValidator = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean()
});

export const storeValidator = z.object({
  storeId: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED", "ERROR"]),
  version: z.string(),
  storeName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string(),
  phone: z.string(),
  minOrderAmount: z.number(),
  active: z.boolean(),
  isDefault: z.boolean(),
  outOfService: z.boolean(),
  cookTime: z.number(),
  enableTips: z.boolean(),
  images: z.array(z.any()), // TODO:
  minOrder: z.number(),
  minOrderSymbol: z.string().nullable(),
  orderSymbol: z.string().nullable(),
  catalogues: z.array(z.string()), // TODO:
  polygons: z.array(z.any()).nullable(), // TODO:
  sponsored: z.boolean(),
  tips: z.array(z.any()).nullable(), // TODO:
  timezone: z.string().nullable(),
  schedules: z.array(syncScheduleValidator),
  location: locationValidator,
  country: z.any().nullable(),
  vendor: idValidator,
  accounts: z.array(idValidator),
  account: accountValidator,
  city: cityValidator
});

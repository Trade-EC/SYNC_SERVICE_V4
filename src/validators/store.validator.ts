import { z } from "zod";

import { scheduleValidator } from "./common.validator";
import { imageValidator, translationValidator } from "./common.validator";
import { numberString } from "./custom.validator";

export const serviceValidator = z.object({
  name: z.string(),
  active: z.boolean(),
  url: z.string()
});

export const storeContactValidator = z.object({
  phone: z.string().max(60)
});

export const storeLocationValidator = z.object({
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  cityId: z.string(),
  state: z.string(),
  stateId: z.string(),
  country: z.string(),
  countryId: z.string(),
  postalCode: z.string()
});

export const storeDeliveryInfo = z.object({
  minimumOrder: z.number(),
  maximumOrder: z.number(),
  cookTime: numberString,
  deliveryId: z.string(),
  shippingCost: z.number()
});

export const polygonValidator = z.object({
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
  type: z.string()
});

export const scheduleByChannelValidator = z.object({
  channelId: z.string(),
  schedules: z.array(scheduleValidator)
});

export const storeValidator = z.object({
  storeId: z.string(),
  name: z.string(),
  active: z.boolean(),
  isDefault: z.boolean(),
  enableTips: z.boolean(),
  timezone: z.string(),
  metadata: z.record(z.string().min(1), z.any()).optional(),
  services: z.array(serviceValidator),
  contactInfo: storeContactValidator,
  locationInfo: storeLocationValidator,
  deliveryInfo: storeDeliveryInfo,
  images: z.array(imageValidator),
  polygons: polygonValidator,
  schedulesByChannel: z.array(scheduleByChannelValidator),
  description: translationValidator
});

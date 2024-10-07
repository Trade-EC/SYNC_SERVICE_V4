import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { schedulesByChannelValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { scheduleValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

export const channelValidator = z.object({
  active: z.boolean(),
  channel: z.string(),
  channelId: z.string(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  channelReferenceName: z.string().optional(),
  ecommerceChannelId: z.number().int().optional()
});

export const storeServicesValidator = z.object({
  name: z.string(),
  active: z.enum(["ACTIVE", "INACTIVE"])
});

export const storeContactValidator = z.object({
  phone: z.string().max(60),
  address: z.string()
});

export const deliveryAdditionalServicesValidator = z.object({
  serviceName: z.string().optional(),
  serviceTimeValue: z.number().optional(),
  serviceTimeUnit: z.string().optional(),
  serviceDescription: z.string().optional(),
  cookTime: z.string().optional(),
  deliveryId: z.coerce.number().int(),
  minimumOrder: z.number().optional(),
  maximumOrder: z.number().optional(),
  serviceCost: z.number(),
  geoType: z.string(),
  geoShape: z.array(z.array(z.array(z.coerce.number()))).nullable(),
  geoDistance: z.number().nullable()
});

export const storeDeliveryValidator = z.object({
  deliveryTimeValue: z.coerce.number().int().optional(),
  deliveryTimeUnit: z.enum(["min", "hour"]).optional(),
  minimumOrder: z.number().optional(),
  shippingCost: z.number().optional(),
  cookTime: z.number().int().optional(),
  deliveryId: z.coerce.number().int().optional(),
  additionalServices: z.array(deliveryAdditionalServicesValidator).optional()
});

export const storeLocationValidator = z.object({
  city: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number()
});

export const storeValidator = z.object({
  name: z.string().max(100),
  active: z.boolean(),
  default: z.boolean(),
  storeId: z.string(),
  // vendorId: z.number().or(z.string()),
  storeCode: z.string().max(60).optional(),
  featured: z.boolean().optional(),
  storeChannels: z.array(z.string()),
  storeImages: z.array(z.string().url()).optional(),
  services: z.array(storeServicesValidator).optional(),
  schedulesByChannel: z.array(schedulesByChannelValidator).optional(),
  taxesInfo: taxesValidator.optional(),
  contactInfo: storeContactValidator,
  deliveryInfo: storeDeliveryValidator.optional(),
  locationInfo: storeLocationValidator,
  paymentMethodInfo: z.record(z.string().min(1), z.any()).optional(),
  schedules: z.array(scheduleValidator).optional()
});

export const scheduledActivitiesValidator = z.object({
  storeId: z.string(),
  scheduledActiveStatus: z.date().optional(),
  scheduledInactiveStatus: z.date().optional()
});

export const channelsAndStoresValidatorRaw = z.object({
  vendorId: z.string(),
  stores: z.array(storeValidator),
  channels: z.array(channelValidator),
  scheduledActivities: z.array(scheduledActivitiesValidator).optional()
});

export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidatorRaw>;

export const channelAndStoresRefine = (
  schema: ChannelsAndStores,
  ctx: z.RefinementCtx
) => {
  const { channels, stores } = schema;

  const channelsId = channels.map(channel => channel.channelId);

  stores.forEach((store, index) => {
    const channelsFound = store.storeChannels.filter(storeChannel =>
      channelsId.includes(storeChannel)
    );

    if (channelsFound.length !== store.storeChannels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stores", index, "storeChannels"],
        message: "StoreChannels not match with channels array"
      });
    }

    const channelsInSchedules = store.schedulesByChannel?.map(
      scheduleChannel => scheduleChannel.channelId
    );

    const scheduleChannelsFound = channelsInSchedules?.filter(
      channelInSchedule => channelsId.includes(channelInSchedule)
    );

    if (channelsInSchedules?.length !== scheduleChannelsFound?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stores", index, "schedulesByChannel"],
        message: "SchedulesByChannel not match with channels array"
      });
    }
  });
};

export const channelsAndStoresValidator =
  channelsAndStoresValidatorRaw.superRefine(channelAndStoresRefine);

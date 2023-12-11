import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { schedulesByChannelValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { scheduleValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { numberStringValidator } from "/opt/nodejs/sync-service-layer/validators/custom.validator";

export const channelValidator = z.object({
  active: z.boolean(),
  channel: z.string(),
  channelId: z.string(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional()
});

export const storeServicesValidator = z.object({
  name: z.string(),
  active: z.enum(["ACTIVE", "INACTIVE"])
});

export const storeContactValidator = z.object({
  phone: z.string().max(60),
  address: z.string()
});

export const storeDeliveryValidator = z.object({
  deliveryTimeValue: z.number().int().or(numberStringValidator),
  deliveryTimeUnit: z.enum(["min", "hour"]),
  minimumOrder: z.number(),
  shippingCost: z.number(),
  cookTime: z.number().int()
});

export const storeLocationValidator = z.object({
  city: z.string(),
  latitude: numberStringValidator,
  longitude: numberStringValidator
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

export const channelsAndStoresValidator = z
  .object({
    vendorId: z.string(),
    stores: z.array(storeValidator),
    channels: z.array(channelValidator),
    scheduledActivities: z.array(scheduledActivitiesValidator).optional()
  })
  .superRefine((schema, ctx) => {
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
  });

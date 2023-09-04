import { z } from "/opt/nodejs/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/validators/common.validator";
import { scheduleValidator } from "/opt/nodejs/validators/common.validator";
import { numberString } from "/opt/nodejs/validators/custom.validator";

export const channelValidator = z.object({
  active: z.boolean(),
  channel: z.string(),
  channelId: z.string(),
  ecommerceChannelId: z.string().optional(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional()
});

// TODO: Enviar mensajes de errores entendibles y granulares
export const storeServicesValidator = z.object({
  // TODO: Confirmar
  name: z.string(),
  active: z.union([z.literal("ACTIVE"), z.literal("INACTIVE")])
});

export const schedulesByChannelValidator = z.object({
  // TODO: Validar con existentes
  channelId: z.string(),
  schedules: z.array(scheduleValidator)
});

export const storeContactValidator = z.object({
  phone: z.string().max(60),
  address: z.string()
});

export const storeDeliveryValidator = z.object({
  deliveryTimeValue: z.number().int().or(numberString),
  deliveryTimeUnit: z.union([z.literal("min"), z.literal("hour")]),
  minimumOrder: z.number(),
  shippingCost: z.number(),
  cookTime: z.number().int()
});

export const storeLocationValidator = z.object({
  city: z.string(),
  latitude: numberString,
  longitude: numberString
});

export const storeValidator = z.object({
  name: z.string().max(100),
  active: z.boolean(),
  default: z.boolean(),
  storeId: z.string(),
  // vendorId: z.number().or(z.string()),
  storeCode: z.string().max(60).optional(),
  featured: z.boolean().optional(),
  // TODO: Validar con existentes
  storeChannels: z.array(z.string()),
  storeImages: z.array(z.string().url()).optional(),
  services: z.array(storeServicesValidator).optional(),
  schedulesByChannel: z.array(schedulesByChannelValidator).optional(),
  taxesInfo: taxesValidator.optional(),
  contactInfo: storeContactValidator,
  deliveryInfo: storeDeliveryValidator.deepPartial().optional(),
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
    force: z.boolean().optional(),
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

import { channelValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeServicesValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidatorRaw } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeContactValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeDeliveryValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeLocationValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

const kfcChannelValidator = z.object({
  additionalInfo: z.record(z.string().min(1), z.any()).array().optional()
});

const kfcStoreChannelsValidator = z.object({
  channelId: z.string()
});

const kfcStoreServicesValidator = z.object({
  active: z.boolean()
});

const kfcLocationInfoValidator = z.object({
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional()
});

const kfcStoreDeliveryValidator = z.object({
  deliveryTimeValue: z.number().int().or(z.string()).optional(),
  deliveryTimeUnit: z.enum(["min", "hour"]).optional(),
  minimumOrder: z.string().optional(),
  shippingCost: z.number().optional(),
  cookTime: z.string().optional()
});

const kfcStoreValidator = z.object({
  storeId: z.number(),
  default: z.boolean().optional(),
  storeChannels: kfcStoreChannelsValidator.array(),
  services: storeServicesValidator
    .merge(kfcStoreServicesValidator)
    .array()
    .optional(),
  taxesInfo: taxesValidator.array().optional(),
  contactInfo: storeContactValidator.array(),
  deliveryInfo: storeDeliveryValidator
    .merge(kfcStoreDeliveryValidator)
    .array()
    .optional(),
  locationInfo: storeLocationValidator.merge(kfcLocationInfoValidator).array()
});

const kfcChannelsAndStoresValidator = z.object({
  vendorId: z.number(),
  channels: channelValidator.merge(kfcChannelValidator).array(),
  stores: storeValidator.merge(kfcStoreValidator).array()
});

type KfcChannelsAndStores = z.infer<typeof kfcChannelsAndStoresValidator>;

export const channelAndStoresRefine = (
  schema: KfcChannelsAndStores,
  ctx: z.RefinementCtx
) => {
  const { channels, stores } = schema;

  const channelsId = channels.map(channel => channel.channelId);

  stores.forEach((store, index) => {
    const channelsFound = store.storeChannels.filter(storeChannel =>
      channelsId.includes(storeChannel.channelId)
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

// -KFC STORES VALIDATOR
export const kfcChannelsAndStoresValidatorMerge = channelsAndStoresValidatorRaw
  .merge(kfcChannelsAndStoresValidator)
  .superRefine(channelAndStoresRefine);

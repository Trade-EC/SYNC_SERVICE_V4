import { channelValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeDeliveryValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidatorRaw } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { scheduleValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

const scStoreDeliveryValidator = z.object({
  cookTime: z.coerce.number().int().optional()
});

const sCstoreValidator = z.object({
  deliveryInfo: storeDeliveryValidator
    .merge(scStoreDeliveryValidator)
    .optional(),
  schedules: z.array(scheduleValidator).optional().nullable()
});

const sCChannelsValidator = z.object({
  additionalInfo: z.record(z.string().min(1), z.any()).optional().nullable()
});

const sCChannelsAndStoresValidator = channelsAndStoresValidatorRaw.merge(
  z.object({
    vendorId: z.number(),
    stores: storeValidator.merge(sCstoreValidator).array(),
    channels: channelValidator.merge(sCChannelsValidator).array()
  })
);

type sCChannelsAndStores = z.infer<typeof sCChannelsAndStoresValidator>;

export const channelAndStoresRefine = (
  schema: sCChannelsAndStores,
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

export const sCChannelsAndStoresValidatorMerge =
  sCChannelsAndStoresValidator.superRefine(channelAndStoresRefine);

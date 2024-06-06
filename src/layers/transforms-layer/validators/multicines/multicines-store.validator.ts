import { channelsAndStoresValidatorRaw } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

const multicinesStoreChannelsValidator = z.object({
  channelId: z.string()
});

const multicinesStoreValidator = z.object({
  storeId: z.number(),
  default: z.boolean().optional(),
  storeChannels: multicinesStoreChannelsValidator.array()
});

const multicinesChannelsAndStoresValidator =
  channelsAndStoresValidatorRaw.merge(
    z.object({
      vendorId: z.number(),
      stores: storeValidator.merge(multicinesStoreValidator).array()
    })
  );

type multicinesChannelsAndStores = z.infer<
  typeof multicinesChannelsAndStoresValidator
>;

export const channelAndStoresRefine = (
  schema: multicinesChannelsAndStores,
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

export const multicinesChannelsAndStoresValidatorMerge =
  multicinesChannelsAndStoresValidator.superRefine(channelAndStoresRefine);

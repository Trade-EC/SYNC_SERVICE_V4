import { z } from "zod";

import { imageValidator, translationValidator } from "./common.validator";
import { yesNoValidator } from "./common.validator";
import { scheduleValidator, oldScheduleValidator } from "./common.validator";

export const categoryAdditionalInfoValidator = z.object({
  externalId: z.string()
});

export const vendorStoreChannelInfoValidator = z.object({
  vendorId: z.string(),
  storeId: z.string(),
  channelId: z.string(),
  position: z.number().int(),
  displayInMenu: yesNoValidator
});

export const categoryValidator = z
  .object({
    categoryId: z.string(),
    name: z.string(),
    title: translationValidator,
    subtitle: translationValidator,
    images: z.array(imageValidator),
    standardTime: yesNoValidator,
    schedules: oldScheduleValidator, // se pediran los 2 schedules?
    schedulesV4: scheduleValidator,
    reload: z.boolean(),
    displayInMenu: yesNoValidator,
    subcategories: z.boolean(),
    featured: z.boolean(),
    available: z.boolean(),
    additionalInfo: categoryAdditionalInfoValidator
  })
  .catchall(z.record(z.string(), z.array(vendorStoreChannelInfoValidator)));

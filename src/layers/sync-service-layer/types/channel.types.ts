import { z } from "zod";

import { standardChannelValidator } from "../validators/channel.validator";

export type StandardChannel = z.infer<typeof standardChannelValidator>;

export interface FetchChannelPayload {
  ecommerceChannelId: number | undefined;
  channelReferenceName: string | undefined;
}

export interface ChannelMappings {
  id: string;
  externalChannelId: string;
  name: string;
}

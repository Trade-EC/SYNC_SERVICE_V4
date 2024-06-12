import { StandardChannel, FetchChannelPayload } from "../types/channel.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchChannels = async (payload?: FetchChannelPayload) => {
  const { ecommerceChannelId, channelReferenceName } = payload ?? {};
  const dbClient = await connectToDatabase();
  const regex = channelReferenceName
    ? new RegExp(channelReferenceName, "i")
    : undefined;
  const standardChannels = await dbClient
    .collection("standardChannels")
    .find(
      {
        channelId: ecommerceChannelId?.toString(),
        tags: regex ? { $regex: regex } : undefined
      },
      { ignoreUndefined: true }
    )
    .toArray();

  console.log(JSON.stringify({ standardChannels }));

  return standardChannels as unknown as StandardChannel[];
};

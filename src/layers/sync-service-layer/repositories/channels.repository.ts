import { StandardChannel, FetchChannelPayload } from "../types/channel.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchChannels = async (payload?: FetchChannelPayload) => {
  const { ecommerceChannelId, channelReferenceName } = payload ?? {};
  const regex = channelReferenceName
    ? new RegExp(channelReferenceName, "i")
    : undefined;
  const dbClient = await connectToDatabase();
  const standardChannels = await dbClient
    .collection("standardChannels")
    .find(
      {
        id: ecommerceChannelId?.toString(),
        tags: regex ? { $regex: regex } : undefined
      },
      { ignoreUndefined: true }
    )
    .toArray();

  console.log(JSON.stringify({ standardChannels }));

  return standardChannels as unknown as StandardChannel[];
};

import { connectToDatabase } from "../utils/mongo.utils";

/**
 *
 * @param externalUrl
 * @param name
 * @description Fetch image
 * @returns {Promise<DbImage>}
 */
export const fetchImage = async (externalUrl: string, name: string) => {
  const dbClient = await connectToDatabase();
  const image = await dbClient
    .collection("images")
    .findOne({ externalUrl, name });

  return image;
};

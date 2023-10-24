import { connectToDatabase } from "../utils/mongo.utils";

export const fetchImage = async (externalUrl: string, category: string) => {
  const dbClient = await connectToDatabase();
  const image = await dbClient
    .collection("images")
    .findOne({ externalUrl, category });

  return image;
};

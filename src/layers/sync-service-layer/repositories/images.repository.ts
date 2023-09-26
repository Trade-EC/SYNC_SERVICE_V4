import { connectToDatabase } from "../utils/mongo.utils";

export const fetchImage = async (url: string, imageCategory: string) => {
  const dbClient = await connectToDatabase();
  const image = await dbClient
    .collection("images")
    .findOne({ url, imageCategory });
  return image;
};

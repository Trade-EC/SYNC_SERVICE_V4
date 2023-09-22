import { sqsClient } from "../configs/config";
import { fetchImage } from "../repositories/images.repository";

export const getAwsDirectory = (imageCategory: string) => {
  switch (imageCategory) {
    case "product":
      return "products/";
    case "category":
      return "categories/";
    case "store":
      return "stores/";
    case "vendor":
      return "vendors/";
    default:
      return "misc";
  }
};

export const imageHandler = async (url: string, imageCategory: string) => {
  const image = await fetchImage(url);
  const response = { url };
  if (image) return response;
  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_IMAGES_SQS_URL!,
    MessageBody: JSON.stringify({ url, imageCategory })
  });

  return response;
};

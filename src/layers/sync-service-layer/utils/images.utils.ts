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
      return "misc/";
  }
};

export const imageHandler = async (url: string, imageCategory: string) => {
  const image = await fetchImage(url, imageCategory);
  const imageProps = getAwsImageProps(url, imageCategory);
  const { bucket, cloudFrontUrl, key, name, url: s3Url } = imageProps;
  const response = { bucket, cloudFrontUrl, key, name, url: s3Url };
  if (image) return response;
  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_IMAGES_SQS_URL!,
    MessageBody: JSON.stringify(imageProps)
  });

  return response;
};

export const getAwsImageProps = (url: string, imageCategory: string) => {
  const name = url.split("/").pop();
  const directory = getAwsDirectory(imageCategory);
  const Key = `${directory}${name}`;
  const Bucket = "syncservicev4.admin.dev";

  return {
    bucket: Bucket,
    key: Key,
    url: `https://s3.us-east-2.amazonaws.com/${Bucket}/${Key}`,
    category: imageCategory,
    cloudFrontUrl: "https://d32dna7apnunfh.cloudfront.net",
    name: imageCategory,
    externalUrl: url
  };
};

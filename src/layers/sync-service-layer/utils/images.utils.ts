import { sqsExtendedClient } from "../configs/config";
import CONSTANTS from "../configs/constants";
import { fetchImage } from "../repositories/images.repository";

const { CLOUDFRONT_URL } = CONSTANTS;
const ADMIN_BUCKET = process.env.SYNC_BUCKET_ADMIN ?? "";

/**
 * @description Get AWS directory
 * @param imageCategory
 * @returns string
 */
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

/**
 *
 * @param url
 * @param imageCategory
 * @description Handle image
 * @returns {Promise<{bucket: string, cloudFrontUrl: string, key: string, name: string, url: string}>}
 */
export const imageHandler = async (url: string, imageCategory: string) => {
  const image = await fetchImage(url, imageCategory);
  const imageProps = getAwsImageProps(url, imageCategory);
  const { bucket, cloudFrontUrl, key, name, url: s3Url } = imageProps;
  const response = { bucket, cloudFrontUrl, key, name, url: s3Url };
  if (image) return response;
  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.SYNC_IMAGES_SQS_URL ?? "",
    MessageBody: JSON.stringify(imageProps)
  });

  return response;
};

/**
 * @description Get AWS image props
 * @param url
 * @param imageCategory
 * @returns bucket: string, cloudFrontUrl: string, key: string, name: string, url: string
 */
export const getAwsImageProps = (url: string, imageCategory: string) => {
  const name = url.split("/").pop();
  const directory = getAwsDirectory(imageCategory);
  const Key = `${directory}${name}`;

  return {
    bucket: ADMIN_BUCKET,
    key: Key,
    url: `https://s3.us-east-2.amazonaws.com/${ADMIN_BUCKET}/${Key}`,
    category: imageCategory,
    cloudFrontUrl: CLOUDFRONT_URL,
    name: imageCategory,
    externalUrl: url
  };
};

import { randomUUID } from "crypto";

import { sqsExtendedClient } from "../configs/config";
import { fetchImage } from "../repositories/images.repository";

const cloudfront = process.env.CLOUDFRONT_URL ?? "";
const cloudFrontUrl = `https://${cloudfront}`;
const REGION: string = process.env.REGION ?? "";
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
  if (image) {
    return {
      bucket: image.bucket,
      cloudFrontUrl: image.cloudFrontUrl,
      key: image.key,
      name: image.name,
      url: image.url
    };
  }
  const imageProps = getAwsImageProps(url, imageCategory);
  const { bucket, cloudFrontUrl, key, name, url: s3Url } = imageProps;
  const transformedUrl = s3Url?.replace(key, encodeURIComponent(key)) ?? null;
  const response = {
    bucket,
    cloudFrontUrl,
    key,
    name,
    url: transformedUrl
  };
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
  const clearUrl = url.split("?")[0];
  const extension = clearUrl.split(".").pop();
  const name = `${randomUUID()}_${new Date().getTime()}.${extension}`; //clearUrl.split("/").pop();
  const directory = getAwsDirectory(imageCategory);
  const Key = `${directory}${name}`;

  return {
    bucket: ADMIN_BUCKET,
    key: Key,
    url: `https://s3.${REGION}.amazonaws.com/${ADMIN_BUCKET}/${Key}`,
    category: imageCategory,
    cloudFrontUrl,
    name: imageCategory,
    externalUrl: clearUrl
  };
};

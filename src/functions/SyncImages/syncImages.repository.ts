import { Image, ImageSync } from "./syncImages.types";

import { CompleteMultipartUploadCommandOutput } from "/opt/nodejs/sync-service-layer/node_modules/@aws-sdk/client-s3";
import { Upload } from "/opt/nodejs/sync-service-layer/node_modules/@aws-sdk/lib-storage";
import { s3Client } from "/opt/nodejs/sync-service-layer/configs/config";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const cloudfront = process.env.CLOUDFRONT_URL ?? "";
const cloudFrontUrl = `https://${cloudfront}`;

/**
 *
 * @param image {@link Image}
 * @description Create or update image
 * @returns void
 */
export const createOrUpdateImages = async (image: Partial<Image>) => {
  const { externalUrl, name } = image;
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("images")
    .updateOne({ externalUrl, name }, { $set: { ...image } }, { upsert: true });
  return image;
};

/**
 *
 * @param url
 * @param imageCategory
 * @description Save image in s3
 * @returns void
 */
export const saveImage = async (imageProps: ImageSync): Promise<Image> => {
  const { externalUrl } = imageProps;
  const rawImage = await fetch(externalUrl ?? "");

  const { bucket, key, name, url: s3Url, category } = imageProps;
  if (!rawImage?.body || !name) throw new Error("Image not found");
  const input = {
    Bucket: bucket,
    Key: key,
    Body: rawImage.body
  };
  const upload = new Upload({
    client: s3Client,
    params: input
  });
  const response = await upload.done();
  const { $metadata } = response;
  if ($metadata.httpStatusCode !== 200) throw new Error("Upload failed");
  const { Location } = response as CompleteMultipartUploadCommandOutput;
  if (!Location) throw new Error("file location not found");

  return {
    cloudFrontUrl,
    bucket,
    key,
    name: category,
    url: s3Url,
    externalUrl,
    status: "DONE"
  };
};

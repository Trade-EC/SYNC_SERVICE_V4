import { CompleteMultipartUploadCommandOutput } from "/opt/nodejs/node_modules/@aws-sdk/client-s3";
import { Upload } from "/opt/nodejs/node_modules/@aws-sdk/lib-storage";
import { getAwsDirectory } from "/opt/nodejs/utils/images.utils";
import { s3Client } from "/opt/nodejs/configs/config";
import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

import { Image } from "./syncImages.types";

export const createOrUpdateImages = async (image: Partial<Image>) => {
  const { externalUrl, category } = image;
  const dbClient = await connectToDatabase();
  await dbClient.collection("images").updateOne(
    { externalUrl, category },
    { $set: { ...image } },
    {
      upsert: true
    }
  );
  return image;
};

export const saveImage = async (
  url: string,
  imageCategory: string
): Promise<Image> => {
  const name = url.split("/").pop();
  const rawImage = await fetch(url);
  const directory = getAwsDirectory(imageCategory);
  const Key = `${directory}${name}`;
  const Bucket = "syncservicev4.admin.dev";
  if (!rawImage.body || !name) throw new Error("Image not found");
  const input = {
    Bucket,
    Key,
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
    bucket: Bucket,
    key: Key,
    name,
    url: Location,
    category: imageCategory,
    externalUrl: url,
    status: "DONE"
  };
};

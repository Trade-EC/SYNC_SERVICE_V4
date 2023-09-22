import { CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { s3Client } from "../configs/config";
import { getAwsDirectory } from "../utils/images.utils";
import { connectToDatabase } from "../utils/mongo.utils";

export const saveImage = async (url: string, imageCategory: string) => {
  try {
    const name = url.split("/").pop();
    const rawImage = await fetch(url);
    const directory = getAwsDirectory(imageCategory);
    const Key = `${directory}${name}`;
    const Bucket = "syncservicev4.admin.dev";
    if (!rawImage.body) return undefined;
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
    if ($metadata.httpStatusCode !== 200) return undefined;
    const { Location } = response as CompleteMultipartUploadCommandOutput;
    return {
      bucket: Bucket,
      key: Key,
      name: directory,
      url: Location
    };
  } catch (e) {
    console.log(JSON.stringify({ e }));
  }
};

export const fetchImage = async (url: string) => {
  const dbClient = await connectToDatabase();
  const image = await dbClient.collection("images").findOne({ url });
  return image;
};

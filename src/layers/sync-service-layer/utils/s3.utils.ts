import {
  CompleteMultipartUploadCommandOutput,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

import { s3Client } from "../configs/config";

const SYNC_BUCKET = process.env.SYNC_BUCKET_SYNC ?? "";

export const createFileS3 = async (
  path: string,
  content: Record<string, any>
) => {
  const params = {
    Bucket: SYNC_BUCKET,
    Key: path,
    Body: Buffer.from(JSON.stringify(content))
  };
  const uploadStores = new Upload({ client: s3Client, params });
  const responseStores = await uploadStores.done();
  console.log("responseStores", JSON.stringify(responseStores));
  const { $metadata: metadata, Location } =
    responseStores as CompleteMultipartUploadCommandOutput;
  const { httpStatusCode } = metadata;
  if (httpStatusCode !== 200) throw new Error("Upload file failed");
  return {
    bucket: SYNC_BUCKET,
    key: path,
    Location
  };
};

export const fetchFileS3 = async (path: string) => {
  const key = path.split("/").slice(3).join("/");
  const params = {
    Bucket: SYNC_BUCKET,
    Key: key
  };
  const response = await s3Client.send(new GetObjectCommand(params));
  const body = await streamToString(response.Body as Readable);
  return JSON.parse(body);
};

const streamToString = (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

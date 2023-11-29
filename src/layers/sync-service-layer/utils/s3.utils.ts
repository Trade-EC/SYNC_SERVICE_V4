import { Upload } from "@aws-sdk/lib-storage";

import { s3Client } from "../configs/config";
import CONSTANTS from "../configs/constants";

const { SYNC_BUCKET } = CONSTANTS.GENERAL;

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
  const { $metadata: metadata } = responseStores;
  const { httpStatusCode } = metadata;
  if (httpStatusCode !== 200) throw new Error("Upload file failed");
  return {
    bucket: SYNC_BUCKET,
    key: path
  };
};

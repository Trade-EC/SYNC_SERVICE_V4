import { Lambda } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";

import CONSTANTS from "./constants";
import { tracer } from "./observability.config";

const { REGION } = CONSTANTS.GENERAL;

export const s3Client = tracer.captureAWSv3Client(
  new S3Client({ region: REGION })
);
export const sqsClient = new SQS({ region: REGION });
export const lambdaClient = new Lambda({ region: REGION });

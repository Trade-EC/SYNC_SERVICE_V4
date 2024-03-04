import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Lambda } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";
// @ts-ignore
import SqsExtendedClient from "sqs-extended-client";

import { tracer } from "./observability.config";

const REGION = process.env.REGION ?? " ";
const serviceConfig = { region: REGION };
const LOGS_BUCKET = process.env.SYNC_BUCKET_LOGS ?? " ";

export const s3Client = tracer.captureAWSv3Client(new S3Client(serviceConfig));
export const sqsClient = new SQS(serviceConfig);
export const lambdaClient = tracer.captureAWSv3Client(
  new Lambda(serviceConfig)
);
export const dynamoDBClient = tracer.captureAWSv3Client(
  new DynamoDBClient(serviceConfig)
);

export const sqsExtendedClient = new SqsExtendedClient({
  sqsClientConfig: serviceConfig,
  s3ClientConfig: serviceConfig,
  bucketName: LOGS_BUCKET
});

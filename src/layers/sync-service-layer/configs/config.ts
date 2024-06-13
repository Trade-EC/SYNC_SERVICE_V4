import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Lambda } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";
import { OpenAI } from "openai";
// @ts-ignore
import SqsExtendedClient from "sqs-extended-client";

import { tracer } from "./observability.config";

const REGION = process.env.REGION ?? " ";
const serviceConfig = { region: REGION };
const LOGS_BUCKET = process.env.SYNC_BUCKET_LOGS ?? " ";

const s3Client = tracer.captureAWSv3Client(new S3Client(serviceConfig));
const sqsClient = new SQS(serviceConfig);
const lambdaClient = tracer.captureAWSv3Client(new Lambda(serviceConfig));
const dynamoDBClient = tracer.captureAWSv3Client(
  new DynamoDBClient(serviceConfig)
);

const sqsExtendedClient = new SqsExtendedClient({
  sqsClientConfig: serviceConfig,
  s3ClientConfig: serviceConfig,
  bucketName: LOGS_BUCKET
});

sqsExtendedClient.sqsClient = tracer.captureAWSv3Client(
  sqsExtendedClient.sqsClient
);
sqsExtendedClient.s3Client = tracer.captureAWSv3Client(
  sqsExtendedClient.s3Client
);

const openaiClient = new OpenAI({
  apiKey: ""
});

export {
  sqsExtendedClient,
  s3Client,
  sqsClient,
  lambdaClient,
  dynamoDBClient,
  openaiClient
};

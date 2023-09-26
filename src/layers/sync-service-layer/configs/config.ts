import { Lambda } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";

export const s3Client = new S3Client({ region: "us-east-2" });
export const sqsClient = new SQS({ region: "us-east-2" });
export const lambdaClient = new Lambda({ region: "us-east-2" });

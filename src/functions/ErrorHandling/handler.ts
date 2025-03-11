import { SQSEvent } from "aws-lambda";

import { saveErrorRecord } from "./errorHandling.repository";

export async function lambdaHandler(event: SQSEvent) {
  console.log("🚨 Error received from DLQ:", JSON.stringify({ event }));

  for (const record of event.Records) {
    const { body } = record;
    const { metadata } = JSON.parse(body);
    console.log("Processing failed message from DLQ:", body);

    await saveErrorRecord(metadata?.lambda ?? "ErrorHandling", body);
  }

  return { statusCode: 200, body: "Errors processed successfully" };
}

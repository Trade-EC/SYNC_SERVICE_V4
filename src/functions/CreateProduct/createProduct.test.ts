import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import * as productSQSEvent from "../../events/product.sqs.json";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

mockClient(sqsClient);

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    const event: SQSEvent = productSQSEvent;
    const result = await lambdaHandler(event, ctx);

    expect(result.batchItemFailures).toEqual([]);
  });
});

import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import * as productSQSEvent from "../../events/product.sqs.json";

import { sqsClient } from "/opt/nodejs/configs/config";

mockClient(sqsClient);

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const sqsSpy = jest.spyOn(sqsClient, "sendMessage");
    const ctx = context();
    ctx.done();
    const event: SQSEvent = productSQSEvent;
    await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
  });
});

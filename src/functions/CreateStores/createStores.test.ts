import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as storeEvent from "../../events/stores.sqs.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    const event: SQSEvent = storeEvent;
    const result = await lambdaHandler(event, ctx);

    expect(result.statusCode).toEqual(200);
  });
});

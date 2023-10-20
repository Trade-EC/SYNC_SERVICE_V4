import { SQSEvent } from "aws-lambda";

import { lambdaHandler } from "./handler";
import * as storeEvent from "../../events/stores.sqs.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const event: SQSEvent = storeEvent;
    const result = await lambdaHandler(event);

    expect(result.statusCode).toEqual(200);
  });
});

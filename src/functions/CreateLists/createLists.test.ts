import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as listsEvent from "../../events/lists.sqs.json";

jest.mock("/opt/nodejs/configs/config");
describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const event: SQSEvent = listsEvent;
    const ctx = context();
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(200);
  });
});

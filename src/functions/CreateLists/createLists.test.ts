import { SQSEvent } from "aws-lambda";

import { lambdaClient } from "/opt/nodejs/configs/config";

import { lambdaHandler } from "./handler";
import * as listsEvent from "../../events/lists.sqs.json";

jest.mock("/opt/nodejs/configs/config");
describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const invokeSpy = jest.spyOn(lambdaClient, "invoke");
    const event: SQSEvent = listsEvent;
    await lambdaHandler(event);
    expect(invokeSpy).toHaveBeenCalled();
  });
});

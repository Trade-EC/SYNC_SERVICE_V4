import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import fetchMock from "jest-fetch-mock";

import { lambdaHandler } from "./handler";
import * as sqsEvent from "../../events/sqs.json";

afterAll(() => {
  jest.resetAllMocks();
  fetchMock.enableMocks();
});

describe("Unit test for app handler", function () {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  // Error case
  it("verifies error response with invalid body", async () => {
    const ctx = context();
    ctx.done();
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify({});
    const result = await lambdaHandler(event, ctx);
    const id = event.Records[0].messageId;
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: id }]);
  });
});

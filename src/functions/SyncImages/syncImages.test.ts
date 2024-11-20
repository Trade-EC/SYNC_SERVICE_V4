import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import fetchMock from "jest-fetch-mock";

import { lambdaHandler } from "./handler";
import { ImageSync } from "./syncImages.types";
import * as sqsEvent from "../../events/sqs.json";

afterAll(() => {
  jest.resetAllMocks();
  fetchMock.resetMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const body: ImageSync = {
      bucket: faker.internet.domainWord(),
      category: "product",
      cloudFrontUrl: faker.internet.url(),
      key: faker.string.alphanumeric(10),
      name: faker.string.alphanumeric(10),
      url: faker.internet.url(),
      externalUrl: faker.internet.avatar(),
      status: "PROCESSING"
    };
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify(body);
    const result = await lambdaHandler(event, ctx);

    expect(result.batchItemFailures).toEqual([]);
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

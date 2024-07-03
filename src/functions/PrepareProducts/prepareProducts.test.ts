import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import { PrepareProductsPayload } from "./prepareProducts.types";
import { buildListRequest } from "../../builders/lists/lists.builders";
import * as sqsEvent from "../../events/sqs.json";

const sqsMockClient = mockClient(sqsExtendedClient.sqsClient);
const mockList = buildListRequest();

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const sqsSpy = jest.spyOn(sqsExtendedClient, "sendMessage");
    const ctx = context();
    const vendorTaxes = { vatRatePercentage: 15 };
    ctx.done();
    const body: PrepareProductsPayload = {
      listInfo: mockList,
      accountId: faker.string.uuid(),
      channelId: faker.string.uuid(),
      listHash: faker.string.alphanumeric(40),
      source: "LISTS",
      syncAll: true,
      requestId: faker.string.uuid(),
      countryId: faker.string.uuid(),
      vendorTaxes
    };
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify(body);
    await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
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

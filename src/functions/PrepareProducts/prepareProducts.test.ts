import { faker } from "@faker-js/faker";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import { PrepareProductsPayload } from "./prepareProducts.types";
import { buildListRequest } from "../../builders/lists/lists.builders";

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
    ctx.done();
    const event: PrepareProductsPayload = {
      listInfo: mockList,
      accountId: faker.string.uuid(),
      channelId: faker.string.uuid(),
      listHash: faker.string.alphanumeric(40),
      source: "LISTS",
      syncAll: true
    };
    await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
  });
});

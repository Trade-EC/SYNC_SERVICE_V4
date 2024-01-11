import { faker } from "@faker-js/faker";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import { PrepareStoresPayload } from "./prepareStores.types";
import { buildChannelsAndStores } from "../../builders/stores/stores.builders";

const sqsMockClient = mockClient(sqsExtendedClient.sqsClient);

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const sqsSpy = jest.spyOn(sqsExtendedClient, "sendMessage");
    const ctx = context();
    ctx.done();
    const event: PrepareStoresPayload = {
      channelsAndStores: buildChannelsAndStores(),
      accountId: faker.string.uuid(),
      storeHash: faker.string.alphanumeric(40),
      vendorChannels: []
    };

    await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
  });
});

import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";
import { buildChannelsAndStores } from "../../builders/stores/stores.builders";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

const sqsMockClient = mockClient(sqsExtendedClient.sqsClient);

jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/vendors.repository",
  () => ({
    fetchVendor: jest.fn(() => ({
      active: true,
      isSyncActive: true
    })),
    fetchMapAccount: jest.fn(() => undefined)
  })
);

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(buildChannelsAndStores())
    };
    const result = await lambdaHandler(event, ctx);

    expect(result.statusCode).toEqual(200);
  });
  // Error case
  it("verifies error response with invalid body", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify({})
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(500);
  });
});

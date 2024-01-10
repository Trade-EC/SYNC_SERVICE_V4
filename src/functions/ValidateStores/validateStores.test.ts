import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import { buildChannelsAndStores } from "../../builders/stores/stores.builders";
import * as gatewayEvent from "../../events/gateway.json";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";
// import { fetchVendor } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";

const sqsMockClient = mockClient(sqsClient);
jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/vendors.repository",
  () => ({
    fetchVendor: jest.fn(() => ({
      active: true
    }))
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
});

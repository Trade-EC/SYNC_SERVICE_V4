import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { buildProductRequest } from "../../builders/lists/lists.builders";
import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

const sqsMockClient = mockClient(sqsExtendedClient.sqsClient);
const s3Client = mockClient(sqsExtendedClient.s3Client);
const mockProducts = buildProductRequest();
const { list } = mockProducts;
const { channelId, ecommerceChannelId, channelReferenceName } = list;
jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/vendors.repository",
  () => ({
    fetchVendor: jest.fn(() => ({
      active: true,
      isSyncActive: true,
      channels: [
        {
          channelId,
          ecommerceChannelId,
          channelReferenceName
        }
      ]
    })),
    fetchMapAccount: jest.fn(() => undefined)
  })
);

beforeEach(() => {
  jest.resetModules(); // Most important - it clears the cache
});

afterAll(() => {
  sqsMockClient.reset();
  s3Client.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(mockProducts)
    };
    const result = await lambdaHandler(event, ctx);
    console.log({ result });
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

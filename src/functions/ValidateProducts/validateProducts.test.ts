import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { buildProductRequest } from "../../builders/lists/lists.builders";
import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

const sqsMockClient = mockClient(sqsClient);
const mockProducts = buildProductRequest();
const { list } = mockProducts;
const { channelId, ecommerceChannelId, channelReferenceName } = list;
jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/vendors.repository",
  () => ({
    fetchVendor: jest.fn(() => ({
      active: true,
      channels: [
        {
          channelId,
          ecommerceChannelId,
          channelReferenceName
        }
      ]
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
      body: JSON.stringify(mockProducts)
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(200);
  });
});

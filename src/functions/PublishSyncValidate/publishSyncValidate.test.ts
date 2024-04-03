import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

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
    const { headers } = gatewayEvent;
    const { account, country } = headers;
    const clientVendorId = faker.string.uuid();
    const body = {
      vendorId: `${account}.${country}.${clientVendorId}`
    };
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(body)
    };
    const result = await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
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

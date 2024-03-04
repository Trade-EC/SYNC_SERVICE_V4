import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

const sqsMockClient = mockClient(sqsClient);

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful with purge response", async () => {
    const sqsSpy = jest.spyOn(sqsClient, "purgeQueue");
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify({ queue: "stores-dlq", action: "purge" })
    };
    const result = await lambdaHandler(event, ctx);
    expect(sqsSpy).toBeCalled();
    expect(result.statusCode).toEqual(200);
  });
  it("verifies successful with reInject response", async () => {
    const sqsSpy = jest.spyOn(sqsClient, "startMessageMoveTask");
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify({ queue: "stores-dlq", action: "reInject" })
    };
    const result = await lambdaHandler(event, ctx);
    expect(sqsSpy).toBeCalled();
    expect(result.statusCode).toEqual(200);
  });
  it("verifies params error response", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify({ queue: "", action: "reInject" })
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(500);
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

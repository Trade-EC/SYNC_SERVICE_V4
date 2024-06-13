import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
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

    expect(result.statusCode).toEqual(200);
  });
});

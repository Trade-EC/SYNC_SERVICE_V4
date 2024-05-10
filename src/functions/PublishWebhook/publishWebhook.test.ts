import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";
import { PublishValidatorProps } from "./publishWebhook.types";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const accountId = faker.string.uuid();

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const body: PublishValidatorProps = {
      accountId,
      vendorId: faker.string.uuid(),
      status: "SUCCESS",
      type: "PRODUCTS",
      publishId: faker.string.uuid()
    };
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: accountId },
      body: JSON.stringify(body)
    };
    const result = await lambdaHandler(event, ctx);
    const dbClient = await connectToDatabase();
    const spy = jest.spyOn(dbClient, "collection");
    expect(spy).toBeCalledWith("publishRequest");
    expect(result.statusCode).toEqual(200);
  });
});

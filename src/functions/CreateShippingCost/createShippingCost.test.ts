import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { CreateShippingCostProps } from "./createShippingCost.types";
import { lambdaHandler } from "./handler";
import * as sqsEvent from "../../events/sqs.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const body: CreateShippingCostProps = {
      accountId: faker.string.uuid(),
      vendorId: faker.string.uuid(),
      channelMappings: [],
      countryId: faker.string.uuid(),
      deliveryId: faker.number.int(),
      oldShippingCostId: null,
      storeId: faker.string.uuid(),
      shippingCost: faker.number.float()
    };
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify(body);
    const result = await lambdaHandler(event, ctx);

    expect(result.batchItemFailures).toEqual([]);
  });
  // Error case
  it("verifies error response with invalid body", async () => {
    const ctx = context();
    ctx.done();
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify({});
    const result = await lambdaHandler(event, ctx);
    const id = event.Records[0].messageId;
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: id }]);
  });
});

import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { CreateStoreProps } from "./createStores.types";
import { lambdaHandler } from "./handler";
import { buildStore } from "../../builders/stores/stores.builders";
import * as sqsEvent from "../../events/sqs.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const body: CreateStoreProps = {
      storeHash: faker.string.alphanumeric(40),
      syncAll: faker.datatype.boolean(),
      requestId: faker.string.uuid(),
      body: {
        accountId: faker.string.uuid(),
        store: buildStore(),
        vendorId: faker.string.uuid(),
        vendorChannels: []
      }
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

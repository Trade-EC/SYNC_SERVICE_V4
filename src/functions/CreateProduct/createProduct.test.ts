import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { CreateProductProps } from "./createProduct.types";
import { lambdaHandler } from "./handler";
import { buildProduct } from "../../builders/lists/lists.builders";
import { genCategories } from "../../builders/lists/lists.builders";
import { genModifierGroups } from "../../builders/lists/lists.builders";
import * as sqsEvent from "../../events/sqs.json";

import { s3Client } from "/opt/nodejs/sync-service-layer/configs/config";
import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

mockClient(sqsClient);
mockClient(s3Client);

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const storesId = faker.helpers.multiple(faker.string.uuid, { count: 5 });
    const body: CreateProductProps = {
      body: {
        accountId: faker.string.uuid(),
        categories: genCategories(),
        channelId: faker.string.uuid(),
        listId: faker.string.uuid(),
        vendorId: faker.string.uuid(),
        listName: faker.commerce.productName(),
        source: "LISTS",
        modifierGroups: genModifierGroups(),
        product: buildProduct(),
        storesId,
        storeId: storesId[0]
      },
      requestId: faker.string.uuid(),
      listHash: faker.string.alphanumeric(40),
      syncAll: faker.datatype.boolean(),
      vendorIdStoreIdChannelId: faker.helpers.multiple(faker.string.uuid, {
        count: 3
      })
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

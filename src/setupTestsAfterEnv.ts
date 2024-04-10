import { FetchChannelPayload } from "./layers/sync-service-layer/types/channel.types";

jest.mock("mongodb", () => {
  return {
    ServerApiVersion: jest.fn(() => ({
      v1: "1"
    })),
    MongoClient: jest.fn(() => ({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          find: jest.fn(() => ({
            sort: jest.fn(() => ({
              limit: jest.fn(() => ({
                toArray: jest.fn(() => [])
              }))
            })),
            toArray: jest.fn(() => [])
          })),
          aggregate: jest.fn(() => ({
            toArray: jest.fn(() => [])
          })),
          findOne: jest.fn(),
          insertOne: jest.fn(),
          updateOne: jest.fn(() => ({ modifiedCount: 1 })),
          bulkWrite: jest.fn(),
          deleteMany: jest.fn(),
          updateMany: jest.fn()
        }))
      }))
    }))
  };
});

jest.mock("@aws-sdk/client-lambda", () => {
  return {
    Lambda: jest.fn(() => ({
      invoke: jest.fn()
    }))
  };
});

jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn(() => ({
    done: jest.fn(() => ({
      $metadata: {
        httpStatusCode: 200
      },
      Location: "location"
    }))
  }))
}));

jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/accounts.repository",
  () => ({
    fetchAccount: jest.fn(accountId => ({
      active: true,
      isSyncActive: true
    }))
  })
);

jest.mock(
  "/opt/nodejs/sync-service-layer/repositories/channels.repository",
  () => ({
    fetchChannels: jest.fn((payload?: FetchChannelPayload) => {
      const { ecommerceChannelId, channelReferenceName } = payload ?? {};
      return [
        {
          id: ecommerceChannelId?.toString(),
          tags: [channelReferenceName]
        }
      ];
    })
  })
);

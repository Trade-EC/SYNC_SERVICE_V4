jest.mock("mongodb", () => {
  return {
    ServerApiVersion: jest.fn(() => ({
      v1: "1"
    })),
    MongoClient: jest.fn(() => ({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          find: jest.fn(() => ({
            toArray: jest.fn(() => [])
          })),
          findOne: jest.fn(),
          insertOne: jest.fn(),
          updateOne: jest.fn(() => ({ modifiedCount: 1 })),
          bulkWrite: jest.fn(),
          deleteMany: jest.fn()
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
      }
    }))
  }))
}));

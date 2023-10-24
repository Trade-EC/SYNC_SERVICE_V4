jest.mock("mongodb", () => {
  return {
    ServerApiVersion: jest.fn(() => ({
      v1: "1"
    })),
    MongoClient: jest.fn(() => ({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          findOne: jest.fn(),
          insertOne: jest.fn(),
          updateOne: jest.fn()
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

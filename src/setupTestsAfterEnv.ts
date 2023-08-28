jest.mock("mongodb", () => {
  return {
    MongoClient: jest.fn(() => ({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          findOne: jest.fn()
        }))
      }))
    }))
  };
});

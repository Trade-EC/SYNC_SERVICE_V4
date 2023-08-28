import { Db, MongoClient } from "mongodb";
const MONGODB_URI = "mongodb://root:example@172.17.0.3:27017";

let cachedDbClient: Db | null = null;

export async function connectToDatabase() {
  if (cachedDbClient) {
    return cachedDbClient;
  }

  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = new MongoClient(MONGODB_URI);

  // Specify which database we want to use
  const db = await client.db("syncService");

  cachedDbClient = db;
  return db;
}

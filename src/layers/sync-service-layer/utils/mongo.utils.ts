import { Db, MongoClient } from "mongodb";
const MONGODB_URI = "mongodb://root:example@p291gsz2-27017.use2.devtunnels.ms/";

let cachedDbClient: Db | null = null;

export async function connectToDatabase() {
  if (cachedDbClient) {
    return cachedDbClient;
  }

  // TODO: Ver lo de topologia para pruebas locales.
  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = new MongoClient(MONGODB_URI, {
    directConnection: false
  });

  // Specify which database we want to use
  const db = await client.db("syncService");

  cachedDbClient = db;
  return db;
}

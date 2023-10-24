import { Db, MongoClient, ServerApiVersion } from "mongodb";

import CONSTANTS from "../configs/constants";
import { logger } from "../configs/observability.config";

const { DB_NAME } = CONSTANTS.GENERAL;

const MONGODB_URI =
  "mongodb+srv://sync_dev:AnVkiEaSsEJ1nhjo@sync-service-dev.nsiunft.mongodb.net/?retryWrites=true&w=majority";

let cachedDbClient: Db | null = null;

export async function connectToDatabase() {
  if (cachedDbClient) {
    logger.info("MongoDB: Using cached database instance");
    return cachedDbClient;
  }

  // TODO: Ver lo de topologia para pruebas locales.
  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  // Specify which database we want to use
  const db = client.db(DB_NAME);

  cachedDbClient = db;
  logger.info("MongoDB: Using new database instance");
  return db;
}

import { Db, MongoClient, ServerApiVersion } from "mongodb";
const MONGODB_URI =
  "mongodb+srv://sync_dev:AnVkiEaSsEJ1nhjo@sync-service-dev.nsiunft.mongodb.net/?retryWrites=true&w=majority";

let cachedDbClient: Db | null = null;

export async function connectToDatabase() {
  if (cachedDbClient) {
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
  const db = client.db("sync-service-dev");

  cachedDbClient = db;
  return db;
}

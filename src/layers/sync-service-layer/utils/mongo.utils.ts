import { Db, MongoClient, ServerApiVersion } from "mongodb";

import CONSTANTS from "../configs/constants";

const { DB_NAME } = CONSTANTS.GENERAL;

const MONGODB_URI =
  "mongodb+srv://sync_dev:AnVkiEaSsEJ1nhjo@sync-service-dev.nsiunft.mongodb.net/?retryWrites=true&w=majority";

let cachedDbClient: Db | null = null;

/**
 * @description Connect to MongoDB
 * @returns Db
 */
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
  const db = client.db(DB_NAME);

  cachedDbClient = db;
  return db;
}

export const getPaginatedData = async (
  collection: string,
  skip: number,
  limit: number,
  filter?: Record<string, any>,
  sort?: Record<string, any>
) => {
  const dbClient = await connectToDatabase();
  const query = await dbClient
    .collection(collection)
    .aggregate(
      [
        {
          $facet: {
            data: [
              { $match: filter },
              { $skip: skip },
              { $limit: limit },
              { $sort: sort }
            ],
            count: [{ $match: filter }, { $count: "total" }]
          }
        },
        { $project: { total: { $first: "$count.total" }, data: 1 } }
      ],
      { ignoreUndefined: true }
    )
    .toArray();

  const { data, total } = query?.[0] ?? { data: [], total: 0 };

  return { total, skip, limit, data };
};

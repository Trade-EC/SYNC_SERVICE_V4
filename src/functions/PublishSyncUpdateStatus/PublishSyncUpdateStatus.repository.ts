import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveStoresInHistory = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean
) => {
  const dbClient = await connectToDatabase();
  const stores = await dbClient
    .collection("stores")
    .find(
      {
        "vendor.id": vendorId,
        "account.id": accountId,
        status: !all ? "DRAFT" : undefined
      },
      { ignoreUndefined: true }
    )
    .toArray();
  if (stores.length > 0) {
    const modifiedStores = stores.map(store => ({
      ...store,
      status: "DELETED",
      deletedAt: new Date(),
      version,
      _id: undefined
    }));

    await dbClient.collection("historyStores").insertMany(modifiedStores);

    logger.info("UPDATE STATUS STORES: DATA", {
      storesProcess: modifiedStores.length
    });
  } else {
    logger.info("No stores found for the given criteria.");
  }
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveProductsInHistory = async (
  vendorId: string,
  accountId: string,
  version: number,
  limitDate: string | Date,
  all: boolean
) => {
  const dbClient = await connectToDatabase();

  // Primero, obtenemos todos los productos que coinciden con los criterios
  const products = await dbClient
    .collection("products")
    .find(
      {
        "vendor.id": vendorId,
        "account.accountId": accountId,
        status: !all ? "DRAFT" : undefined,
        createdAt: { $lt: new Date(limitDate) }
      },
      { ignoreUndefined: true }
    )
    .toArray();

  if (products.length > 0) {
    const modifiedProducts = products.map(product => ({
      ...product,
      status: "DELETED",
      deletedAt: new Date(),
      version,
      _id: undefined
    }));

    await dbClient.collection("historyProducts").insertMany(modifiedProducts);

    logger.info("UPDATE STATUS PRODUCTS: DATA", {
      productsProcess: modifiedProducts.length
    });
  } else {
    logger.info("No products found for the given criteria.");
  }
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status stores in stores collection
 * @returns void
 */
export const updateStatusStores = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .updateMany(
      { "vendor.id": vendorId, "account.id": accountId, status: "DRAFT" },
      { $set: { status: "PUBLISHED" } }
    );

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status products in products collection
 * @returns void
 */
export const updateStatusProducts = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("products").updateMany(
    {
      "vendor.id": vendorId,
      "account.accountId": accountId,
      status: "DRAFT"
    },
    { $set: { status: "PUBLISHED" } }
  );

  return response;
};

export const saveVersion = async (
  vendorId: string,
  accountId: string,
  version: number,
  type: "STORES" | "PRODUCTS" | "SHIPPING_COSTS"
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("versions").insertOne({
    vendorId,
    accountId,
    version,
    createdAt: new Date(
      new Date().toLocaleString("en", { timeZone: "America/Guayaquil" })
    ),
    type
  });

  return response;
};

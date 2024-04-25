const stageName = process.env.STAGE_NAME || "dev";

const CONSTANTS = {
  GENERAL: {
    SERVICE_NAME: "SYNC_SERVICE_V4",
    DB_NAME: `sync-service-${stageName}`,
    SQS_MAX_BATCH_SIZE: 3
  }
};

export default CONSTANTS;

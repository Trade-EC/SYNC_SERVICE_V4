import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";

import CONSTANTS from "./constants";

const { GENERAL } = CONSTANTS;
const { SERVICE_NAME } = GENERAL;

const logger = new Logger({ serviceName: SERVICE_NAME });

const metrics = new Metrics({ serviceName: SERVICE_NAME });

const tracer = new Tracer({ serviceName: SERVICE_NAME });

export { logger, metrics, tracer };

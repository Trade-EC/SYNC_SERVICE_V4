import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

import { publishWebhookValidator } from "./publishWebhook.validator";

export type PublishValidatorProps = z.infer<typeof publishWebhookValidator>;

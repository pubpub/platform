import { logger } from "logger";

import { registerCorePubField } from "./actions/_lib/init";
import { corePubFields } from "./actions/corePubFields";

logger.info("Registering core fields");
for (const corePubField of corePubFields) {
	logger.info(`Registering core field ${corePubField.slug}`);
	await registerCorePubField(corePubField);
}

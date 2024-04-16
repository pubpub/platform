import { makeClient, Parse } from "@pubpub/sdk";

import manifest from "../pubpub-integration.json";

export const client = makeClient(manifest as Parse<typeof manifest>);

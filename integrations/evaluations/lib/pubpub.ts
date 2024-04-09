import manifest from "pubpub-integration.json";

import { makeClient, Parse } from "@pubpub/sdk";

export const client = makeClient(<Parse<typeof manifest>>manifest);

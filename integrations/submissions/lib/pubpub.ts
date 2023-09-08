import { makeClient } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { expect } from "utils";

export const client = makeClient(manifest, expect(process.env.API_KEY));

import { makeClient, Parse } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { expect } from "utils";

export const client = makeClient(<Parse<typeof manifest>>manifest, expect(process.env.API_KEY));

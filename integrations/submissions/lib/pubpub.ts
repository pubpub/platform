import { makeClient, Parse } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";

export const client = makeClient(<Parse<typeof manifest>>manifest);

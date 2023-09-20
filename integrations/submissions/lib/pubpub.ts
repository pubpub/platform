import { Parse, makeClient } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";

export const client = makeClient(<Parse<typeof manifest>>manifest);

"use server";

import { RunProps } from "../types";
import type { RunConfig, RunPubType } from "./action";

export async function run({ pub, config }: RunProps<RunPubType, RunConfig>) {
	// Do something with `pub` and `config`
}

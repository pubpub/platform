import type { RunProps } from "../types";
import type { action } from "./action";

export async function run({ pub, config, pubConfig }: RunProps<typeof action>) {
	console.log(pub);
}

import * as z from "zod";
import * as fields from "../fields";
import { ConfigProps, RunProps, defineAction } from "../types";
import { run } from "./run";

export type RunPubType = [typeof fields.title];
export type RunConfig = { debounce?: number };

const Run = (props: RunProps<RunPubType, RunConfig>) => {
	const onClick = async () => {
		try {
			await run(props);
		} catch (e) {
			console.error(e);
		}
	};
	return <button onClick={onClick}>Run</button>;
};

const Configure = (props: ConfigProps<RunConfig>) => {
	// Render form using `props.config`
	return <div>Configure</div>;
};

export const log = defineAction({
	name: "log",
	fields: [fields.title],
	config: z.object({
		debounce: z.number().optional(),
	}),
	run,
	ui: {
		Configure,
		Run,
	},
});

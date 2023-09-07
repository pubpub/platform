"use client";

import { useState, useTransition } from "react";
import { configure } from "./actions";

type Props = {
	instanceId: string;
	pubTypeId?: string;
};

export function Configure(props: Props) {
	const [message, setMessage] = useState<string>("");
	const [isPending, startTransition] = useTransition();

	async function onConfigure(form: FormData) {
		const response = await configure(form);
		setMessage("error" in response ? response.error : "Instance configured!");
	}

	return (
		<form action={(form) => startTransition(() => onConfigure(form))}>
			<input type="text" name="pub-type-id" defaultValue={props.pubTypeId} />
			<input type="hidden" name="instance-id" value={props.instanceId} />
			<button type="submit">Configure</button>
			<p>{isPending ? "Configuring instance..." : message}</p>
		</form>
	);
}

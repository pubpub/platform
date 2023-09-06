"use client";

import { useState } from "react";
import { configure } from "./actions";
import { experimental_useFormStatus } from "react-dom";

type Props = {
	instanceId: string;
	pubTypeId: string;
};

export function Configure(props: Props) {
	const form = experimental_useFormStatus();
	const [message, setMessage] = useState<string>("");

	async function onConfigure(form: FormData) {
		const { message } = await configure(props.instanceId, form.get("pub-type-id") as string);
		setMessage(message);
	}

	return (
		<form action={onConfigure}>
			<input type="text" name="pub-type-id" defaultValue={props.pubTypeId} />
			<button type="submit">Configure</button>
			{form.pending && <p>Loading</p>}
			{message && <p>{message}</p>}
		</form>
	);
}

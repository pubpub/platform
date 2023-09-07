"use client";

import { useState, useTransition } from "react";
import { submit } from "./actions";

type Props = {
	instanceId: string;
	token: string;
};

export function Submit(props: Props) {
	const [message, setMessage] = useState<string>("");
	const [isPending, startTransition] = useTransition();

	async function onSubmit(form: FormData) {
		const response = await submit(form, props.token);
		setMessage("error" in response ? response.error : "Pub submitted!");
	}

	return (
		<form action={(form) => startTransition(() => onSubmit(form))}>
			<label>
				<span>Title</span>
				<input type="text" name="Title" />
			</label>
			<input type="hidden" name="instance-id" value={props.instanceId} />
			<button type="submit">Submit</button>
			<p>{isPending ? "Submitting Pub..." : message}</p>
		</form>
	);
}

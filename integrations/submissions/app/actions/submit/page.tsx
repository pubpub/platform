"use client";

import { useState, useTransition } from "react";
import { submit } from "./actions";

export default function Page(props: { searchParams: { instanceId: string } }) {
	const { instanceId } = props.searchParams;
	const [message, setMessage] = useState<string>("");
	const [isPending, startTransition] = useTransition();

	async function onSubmit(form: FormData) {
		const response = await submit(form);
		setMessage("error" in response ? response.error : "Pub submitted!");
	}

	return (
		<form action={(form) => startTransition(() => onSubmit(form))}>
			<label>
				<span>Title</span>
				<input type="text" name="Title" />
			</label>
			<input type="hidden" name="instance-id" value={instanceId} />
			<button type="submit">Submit</button>
			<p>{isPending ? "Submitting Pub..." : message}</p>
		</form>
	);
}

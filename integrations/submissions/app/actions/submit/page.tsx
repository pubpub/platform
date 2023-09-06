"use client";

import { useState } from "react";
import { submit } from "./actions";

export default function Page(props: { searchParams: { instanceId: string } }) {
	const { instanceId } = props.searchParams;
	const [message, setMessage] = useState<string>("");

	async function onSubmit(form: FormData) {
		const response = await submit(form);
		setMessage(response.message);
	}

	return (
		<form action={onSubmit}>
			<label>
				<span>Title</span>
				<input type="text" name="Title" />
			</label>
			<input type="hidden" name="instance-id" value={instanceId} />
			<button type="submit">Submit</button>
			<p>{message}</p>
		</form>
	);
}

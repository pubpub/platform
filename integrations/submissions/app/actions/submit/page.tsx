"use client";

import { useState } from "react";
import { create } from "./actions";

export default function Page(props: { searchParams: { instanceId: string } }) {
	const { instanceId } = props.searchParams;
	const [message, setMessage] = useState<string>("");

	async function onCreate(form: FormData) {
		const response = await create(form);
		setMessage(response.message);
	}

	return (
		<form action={onCreate}>
			<label>
				<span>Title</span>
				<input type="text" name="title" />
			</label>
			<input type="hidden" name="instance-id" value={instanceId} />
			<button type="submit">Add</button>
			<p>{message}</p>
		</form>
	);
}

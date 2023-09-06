import { configure } from "./actions";
import { findInstance } from "~/lib/instance";

export default async function Page(props: { searchParams: { instanceId: string } }) {
	const { instanceId } = props.searchParams;
	const instance = await findInstance(instanceId);

	async function onConfigure(form: FormData) {
		"use server";
		const response = await configure(instanceId, form.get("pub-type-id") as string);
		console.log(response);
	}

	return (
		<form action={onConfigure}>
			<input type="text" name="pub-type-id" defaultValue={instance?.pubTypeId ?? ""} />
			<button type="submit">Configure</button>
		</form>
	);
}

import { client } from "~/lib/client";
import { findInstance } from "~/lib/instance";
import { Configure } from "./configure";

export default async function Page(props: { searchParams: { instanceId: string; token: string } }) {
	const { instanceId, token } = props.searchParams;
	const user = await client.auth(instanceId, token);
	const instance = await findInstance(instanceId);
	return (
		<main>
			<p>Hello {user.name}</p>
			<img src={`${process.env.PUBPUB_URL}/${user.avatar}`} />
			<Configure instanceId={instanceId} pubTypeId={instance?.pubTypeId} />
		</main>
	);
}

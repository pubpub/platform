import { makeClient } from "@pubpub/sdk";
import { findInstance, makeInstance } from "~/lib/instance";
import manifest from "~/pubpub-integration.json";

type Props = { searchParams: { instanceId: string; pubId: string } };

const client = makeClient(manifest);

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const instance = (await findInstance(instanceId)) ?? makeInstance();
	const { title } = await client.get(instanceId, pubId, "title");
	return (
		<>
			<h2>Run</h2>
			<p>Instance</p>
			<pre>
				<code>{JSON.stringify(instance)}</code>
			</pre>
			<p>Pub Values</p>
			<pre>
				<code>{String(title)}</code>
			</pre>
		</>
	);
}

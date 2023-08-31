import { findInstance, makeInstance } from "~/lib/instance";

type Props = { searchParams: { instanceId: string } };

export default async function Page(props: Props) {
	const instance = (await findInstance(props.searchParams.instanceId)) ?? makeInstance();
	return (
		<>
			<h2>Configure</h2>
			<pre>
				<code>{JSON.stringify(instance)}</code>
			</pre>
		</>
	);
}

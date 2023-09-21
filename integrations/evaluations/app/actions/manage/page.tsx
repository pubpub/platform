import { client } from "~/lib/pubpub";
import { EmailForm } from "./emailForm";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: any;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const pub = await client.getPub(instanceId, pubId);

	return (
		<div>
			<p>
				"{pub.values.Title as string}" has been evaluated {pub.children.length} times:
			</p>
			<ul>
				{pub.children.map((child) => (
					<li key={child.id}>{child.values.Title as string}</li>
				))}
			</ul>
			<EmailForm instanceId={instanceId} pub={pub} />
		</div>
	);
}

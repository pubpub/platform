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
	const emailTemplate = "Hello i dont know where this is comming from, probs his file disk";

	return (
		<div>
			<p>
				"{pub.values["unjournal:title"] as string}" has been evaluated {pub.children.length}{" "}
				times:
			</p>
			<ul>
				{pub.children.map((child) => (
					<li key={child.id}>{child.values.Title as string}</li>
				))}
			</ul>
			<EmailForm instanceId={instanceId} pub={pub} emailTemplate={emailTemplate} />
		</div>
	);
}

import { client } from "~/lib/pubpub";
import { Evaluate } from "./evaluate";
import { findInstance } from "~/lib/instance";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const pub = await client.getPub(instanceId, pubId);

	// Dangerously hardcode pubType for now while local redis isn't working
	const pubType = await client.getPubType(instanceId, "81d18691-3ac4-42c1-b55b-d3b2c065b9ad");
	return <Evaluate instanceId={instanceId} pub={pub} pubType={pubType} />;
}

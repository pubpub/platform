import { client } from "~/lib/pubpub";
import { Evaluate } from "./evaluate";
import { getInstanceConfig } from "~/lib/instance";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const pub = await client.getPub(instanceId, pubId);

	const instance = await getInstanceConfig(instanceId);
	//dangerously assert instance exists
	const pubType = await client.getPubType(instanceId, instance!.pubTypeId);
	return <Evaluate instanceId={instanceId} pub={pub} pubType={pubType} />;
}

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
	const instance = await findInstance(instanceId);
	console.log(instance);
	return <Evaluate instanceId={instanceId} pub={pub} />;
}

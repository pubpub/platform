import { client } from "~/lib/pubpub";
import { Evaluate } from "./evaluate";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const pub = await client.getPub(instanceId, pubId);

	return <Evaluate instanceId={instanceId} pub={pub} />;
}

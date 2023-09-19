import { ReadResponse } from "@pubpub/sdk";
import { Evaluate } from "./evaluate";
import { client } from "~/lib/pubpub";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const pub = await client.read(instanceId, pubId);

	return <Evaluate instanceId={instanceId} pub={pub} />;
}

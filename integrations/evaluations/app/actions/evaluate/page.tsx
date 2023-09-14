import { Evaluate } from "./evaluate";
import { Client } from "@pubpub/sdk";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	return <Evaluate instanceId={instanceId} pubId={pubId} />;
}

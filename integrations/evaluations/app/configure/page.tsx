import { getInstanceConfig } from "~/lib/instance";
import { Configure } from "./configure";

type Props = {
	searchParams: {
		instanceId: string;
		pubId?: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const instanceConfig = await getInstanceConfig(instanceId);
	return <Configure instanceId={instanceId} instanceConfig={instanceConfig} pubId={pubId} />;
}

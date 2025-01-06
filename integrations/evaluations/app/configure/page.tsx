import { getInstanceConfig } from "~/lib/instance";
import { Configure } from "./configure";

type Props = {
	searchParams: Promise<{
		instanceId: string;
		pubId?: string;
	}>;
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = (await props.searchParams);
	const instanceConfig = await getInstanceConfig(instanceId);
	return <Configure instanceId={instanceId} instanceConfig={instanceConfig} pubId={pubId} />;
}

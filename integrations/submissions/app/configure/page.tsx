import { getInstanceConfig } from "~/lib/instance";
import { Configure } from "./configure";

type Props = {
	searchParams: Promise<{
		instanceId: string;
	}>;
};

export default async function Page(props: Props) {
	const { instanceId } = await props.searchParams;
	const instanceConfig = await getInstanceConfig(instanceId);
	return <Configure instanceId={instanceId} pubTypeId={instanceConfig?.pubTypeId} />;
}

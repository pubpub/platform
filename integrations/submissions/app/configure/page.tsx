import { getInstanceConfig } from "~/lib/instance";
import { Configure } from "./configure";

type Props = {
	searchParams: {
		instanceId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId } = props.searchParams;
	const instance = await getInstanceConfig(instanceId);
	return <Configure instanceId={instanceId} pubTypeId={instance?.pubTypeId} />;
}

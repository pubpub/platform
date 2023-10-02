import { findInstance } from "~/lib/instance";
import { Configure } from "./configure";

type Props = {
	searchParams: {
		instanceId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId } = props.searchParams;
	const instance = await findInstance(instanceId);
	const emailTemplate = "Hello i dont know where this is comming from, probs his file disk";
	return (
		<Configure
			instanceId={instanceId}
			pubTypeId={instance?.pubTypeId}
			emailTemplate={emailTemplate}
		/>
	);
}

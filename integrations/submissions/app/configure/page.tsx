import { findInstance } from "~/lib/instance";
import { Configure } from "./configure";

export default async function Page(props: { searchParams: { instanceId: string } }) {
	const { instanceId } = props.searchParams;
	const instance = await findInstance(instanceId);
	return <Configure instanceId={instanceId} pubTypeId={instance?.pubTypeId} />;
}

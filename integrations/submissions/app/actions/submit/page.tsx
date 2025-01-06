import { Submit } from "./submit";

type Props = {
	searchParams: Promise<{
		instanceId: string;
	}>;
};

export default async function Page(props: Props) {
	const { instanceId } = await props.searchParams;
	return <Submit instanceId={instanceId} />;
}

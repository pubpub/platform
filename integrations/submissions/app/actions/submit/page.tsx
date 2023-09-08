import { Submit } from "./submit";

type Props = {
	searchParams: {
		instanceId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId } = props.searchParams;
	return <Submit instanceId={instanceId} />;
}

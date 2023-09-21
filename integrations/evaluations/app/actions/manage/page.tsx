import { EmailForm } from "./emailForm";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: any;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;

	return <EmailForm instanceId={instanceId} pubId={pubId} />;
}

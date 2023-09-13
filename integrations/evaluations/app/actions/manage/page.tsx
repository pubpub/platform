type Props = {
	searchParams: {
		instanceId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId } = props.searchParams;
	return <h1>Evaluation Integration</h1>;
}

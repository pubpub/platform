import { client } from "~/lib/pubpub";
import { Submit } from "./submit";

type Props = {
	searchParams: {
		instanceId: string;
		token: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, token } = props.searchParams;
	const user = await client.auth(instanceId, token);

	return (
		<main>
			<p>Hello {user.name}</p>
			<img src={`${process.env.PUBPUB_URL}/${user.avatar}`} />
			<Submit instanceId={instanceId} />
		</main>
	);
}

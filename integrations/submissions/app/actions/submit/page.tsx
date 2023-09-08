import { client } from "~/lib/pubpub";
import { Submit } from "./submit";
import { Avatar, AvatarFallback, AvatarImage } from "ui";

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
		<>
			<Avatar>
				<AvatarImage src={`${process.env.PUBPUB_URL}/${user.avatar}`} />
				<AvatarFallback>{user.name[0]}</AvatarFallback>
			</Avatar>
			<Submit instanceId={instanceId} />
		</>
	);
}

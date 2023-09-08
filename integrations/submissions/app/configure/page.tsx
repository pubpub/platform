import { client } from "~/lib/pubpub";
import { findInstance } from "~/lib/instance";
import { Configure } from "./configure";
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
	const instance = await findInstance(instanceId);
	return (
		<>
			<Avatar>
				<AvatarImage src={`${process.env.PUBPUB_URL}/${user.avatar}`} />
				<AvatarFallback>{user.name[0]}</AvatarFallback>
			</Avatar>
			<Configure instanceId={instanceId} pubTypeId={instance?.pubTypeId} />
		</>
	);
}

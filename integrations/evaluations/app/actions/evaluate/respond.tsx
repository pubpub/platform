import { GetPubResponseBody } from "@pubpub/sdk";
import { useCallback } from "react";
import { Button } from "ui";
import { accept, decline } from "./actions";

type Props = {
	instanceId: string;
	userId: string;
	pub: GetPubResponseBody;
};

export const Respond = (props: Props) => {
	const onAccept = useCallback(() => {
		accept(props.instanceId, props.pub.id, props.userId);
	}, []);
	const onDecline = useCallback(() => {
		decline(props.instanceId, props.pub.id, props.userId);
	}, []);
	return (
		<>
			<Button onClick={onAccept}>Accept</Button>
			<Button onClick={onDecline}>Decline</Button>
		</>
	);
};

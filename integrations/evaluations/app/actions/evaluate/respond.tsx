"use client";

import { GetPubResponseBody } from "@pubpub/sdk";
import { useCallback } from "react";
import { Button } from "ui";
import { accept, decline } from "./actions";

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
};

export const Respond = (props: Props) => {
	const onAccept = useCallback(() => {
		accept(props.instanceId, props.pub.id);
	}, []);
	const onDecline = useCallback(() => {
		decline(props.instanceId, props.pub.id);
	}, []);
	return (
		<>
			<Button onClick={onAccept}>Accept</Button>
			<Button onClick={onDecline}>Decline</Button>
		</>
	);
};

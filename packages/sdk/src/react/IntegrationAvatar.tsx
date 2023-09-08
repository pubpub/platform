import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "ui";

type Props = {
	name: string;
	url: string;
};

export const IntegrationAvatar = (props: Props) => {
	return (
		<Avatar>
			<AvatarImage src={props.url} />
			<AvatarFallback>{props.name[0]}</AvatarFallback>
		</Avatar>
	);
};

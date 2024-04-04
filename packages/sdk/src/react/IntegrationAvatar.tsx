import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

type Props = {
	firstName: string;
	url: string;
};

export const IntegrationAvatar = (props: Props) => {
	return (
		<Avatar>
			<AvatarImage src={props.url} />
			<AvatarFallback>{props.firstName[0]}</AvatarFallback>
		</Avatar>
	);
};

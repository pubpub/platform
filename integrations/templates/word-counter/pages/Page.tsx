import { Instance } from "../types";

type Props = {
	children: string | string[];
	title: string;
	instance?: Instance;
	pubId?: string;
	[key: string]: any;
};

export const Page = (props: Props) => {
	const { title, children, ...rest } = props;
	return (
		<html x-init={props.pubId ? `$store.pubId = "${props.pubId}"` : undefined}>
			<head>
				<title>{props.title}</title>
				<link rel="preconnect" href="https://rsms.me/" />
				<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
				<link rel="stylesheet" href="/style.css" />
				<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.12.3/dist/cdn.min.js" />
			</head>
			<body
				{...rest}
				x-init={props.instance ? `$store.instance = ${JSON.stringify(props.instance)}` : undefined}
			>
				<header>
					<h1>{title}</h1>
				</header>
				<main>{children}</main>
			</body>
		</html>
	);
};

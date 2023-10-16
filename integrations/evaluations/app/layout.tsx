import { headers } from "next/headers";
import { Toaster } from "ui";
import "ui/styles.css";
import { expect } from "utils";
import { Integration } from "~/lib/Integration";
import { InstanceConfig, getInstanceConfig } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import "./globals.css";

export const metadata = {
	title: "PubPub Evaluations Integration",
	description: "",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	// This header is set in the root middleware module, which allows layouts
	// to fetch data using search parameters.
	const search = expect(headers().get("x-next-search"));
	const searchParams = new URLSearchParams(search);
	const instanceId = expect(searchParams.get("instanceId"));
	const token = expect(searchParams.get("token"));
	const user = await client.auth(instanceId, token);
	let instance: InstanceConfig | undefined;
	if (instanceId) {
		instance = await getInstanceConfig(instanceId);
	}
	return (
		<html lang="en">
			<body>
				<Integration
					name="Evaluations"
					user={{ ...user, avatar: `${process.env.PUBPUB_URL}/${user.avatar}` }}
					instance={instance}
				>
					{children}
				</Integration>
				<Toaster />
			</body>
		</html>
	);
}

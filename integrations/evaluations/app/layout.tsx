import { User } from "@pubpub/sdk";
import { cookies } from "next/headers";
import { Toaster } from "ui";
import "ui/styles.css";
import { expect } from "utils";
import { Integration } from "~/lib/Integration";
import { InstanceConfig, getInstanceConfig } from "~/lib/instance";
import "./globals.css";

export const metadata = {
	title: "PubPub Evaluations Integration",
	description: "",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	// This header is set in the root middleware module, which allows layouts
	// to fetch data using search parameters.
	const instanceId = expect(cookies().get("instanceId")?.value);
	const user: User = JSON.parse(expect(cookies().get("user")).value);
	let config: InstanceConfig | undefined;
	if (instanceId) {
		config = await getInstanceConfig(instanceId);
	}
	return (
		<html lang="en">
			<body>
				<Integration<InstanceConfig>
					name="Evaluations"
					user={{ ...user, avatar: `${process.env.PUBPUB_URL}/${user.avatar}` }}
					config={config}
				>
					{children}
				</Integration>
				<Toaster />
			</body>
		</html>
	);
}

import { User } from "@pubpub/sdk";
import { Toaster } from "ui";
import "ui/styles.css";
import { expect } from "utils";
import { Integration } from "~/lib/Integration";
import { getInstanceConfig } from "~/lib/instance";
import { cookie } from "~/lib/request";
import { InstanceConfig } from "~/lib/types";
import { env } from "~/lib/env.mjs";

import "./globals.css";

export const metadata = {
	title: "PubPub Evaluations Integration",
	description: "",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const instanceId = expect(cookie("instanceId"), "instanceId missing");
	const user: User = JSON.parse(expect(cookie("user"), "user missing"));
	let instanceConfig: InstanceConfig | undefined;
	if (instanceId) {
		instanceConfig = await getInstanceConfig(instanceId);
	}
	return (
		<html lang="en">
			<body>
				<Integration<InstanceConfig>
					name="Evaluations"
					user={{ ...user, avatar: `${env.PUBPUB_URL}/${user.avatar}` }}
					config={instanceConfig}
				>
					{children}
				</Integration>
				<Toaster />
			</body>
		</html>
	);
}

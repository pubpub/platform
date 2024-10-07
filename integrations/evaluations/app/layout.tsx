import type { User } from "@pubpub/sdk";
import { Toaster } from "ui/toaster";

import "ui/styles.css";

import { expect } from "utils";

import type { InstanceConfig } from "~/lib/types";
import { env } from "~/lib/env.mjs";
import { getInstanceConfig } from "~/lib/instance";
import { Integration } from "~/lib/Integration";
import { cookie } from "~/lib/request";

import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
	title: "PubPub Evaluations Integration",
	description: "",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
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

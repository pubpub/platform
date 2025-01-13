import { cookies, headers } from "next/headers"

import type { User } from "@pubpub/sdk"
import { Toaster } from "ui/toaster"

import { env } from "~/lib/env.mjs"

import "ui/styles.css"

import { expect } from "utils"

import type { InstanceConfig } from "~/lib/types"
import { getInstanceConfig } from "~/lib/instance"
import { Integration } from "~/lib/Integration"

import "./globals.css"

import type { ReactNode } from "react"

export const metadata = {
	title: "PubPub Submissions Integration",
	description: "",
}

const cookie = (name: string) => {
	const _cookies = cookies()
	const _headers = headers().get("Set-Cookie")
	const setCookiePatern = new RegExp(`${name}=(.*?);`)
	if (_headers) {
		const m = _headers.match(setCookiePatern)
		if (m) {
			return decodeURIComponent(m?.[1]!)
		}
	}
	if (_cookies.has(name)) {
		return decodeURIComponent(_cookies.get(name)!.value)
	}
	return undefined
}

export default async function RootLayout({ children }: { children: ReactNode }) {
	const instanceId = expect(cookie("instanceId"), "instanceId missing")
	const user: User = JSON.parse(expect(cookie("user"), "user missing"))
	let instanceConfig: InstanceConfig | undefined
	if (instanceId) {
		instanceConfig = await getInstanceConfig(instanceId)
	}
	return (
		<html lang="en">
			<body>
				<Integration<InstanceConfig>
					name="Submissions"
					user={{ ...user, avatar: `${env.PUBPUB_URL}/${user.avatar}` }}
					config={instanceConfig}
				>
					{children}
				</Integration>
				<Toaster />
			</body>
		</html>
	)
}

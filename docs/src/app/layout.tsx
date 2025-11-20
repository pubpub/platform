import type { Metadata } from "next"

import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import { Footer, Layout, Navbar } from "nextra-theme-docs"

import "./globals.css"
import "nextra-theme-docs/style.css"

import { path } from "../../utils/path"

export const metadata: Metadata = {
	title: {
		template: "%s | PubPub Developer Docs",
		default: "PubPub Developer Docs",
	},
}

const navbar = (
	<Navbar
		logo={
			<div className="flex items-center">
				<img src={path("/logo.svg")} alt="PubPub" height="20" width="20" />
				<span className="ml-2 font-semibold">PubPub Development Docs</span>
			</div>
		}
		projectLink="https://github.com/pubpub/platform"
		logoLink={path("/")}
	/>
)
const footer = <Footer>MIT {new Date().getFullYear()} © Knowledge Futures Inc.</Footer>

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" dir="ltr" suppressHydrationWarning>
			<Head>
				{/* Your additional tags should be passed as `children` of `<Head>` element */}
			</Head>
			<body>
				<Layout
					navbar={navbar}
					pageMap={await getPageMap()}
					docsRepositoryBase="https://github.com/pubpub/platform/tree/main/docs"
					footer={footer}
					sidebar={{
						defaultOpen: true,
					}}
				>
					{children}
				</Layout>
			</body>
		</html>
	)
}

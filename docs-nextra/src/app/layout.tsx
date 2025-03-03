import { Metadata } from "next";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";

// import "./globals.css";
import "nextra-theme-docs/style.css";

export const metadata: Metadata = {
	title: {
		template: "%s | PubPub Developer Docs",
		default: "PubPub Developer Docs",
	},
	// Define your metadata here
	// For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

// const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const navbar = (
	<Navbar
		logo={<img src="/logo.svg" alt="PubPub" height="20" width="20" className="h-4 w-4" />}
		projectLink="https://github.com/pubpub/platform"
		logoLink="/"
		// ... Your additional navbar options
	/>
);
const footer = <Footer>MIT {new Date().getFullYear()} © Knowledge Futures Inc.</Footer>;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			// Not required, but good for SEO
			lang="en"
			// Required to be set
			dir="ltr"
			// Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
			suppressHydrationWarning
		>
			<Head
			// ... Your additional head options
			>
				{/* Your additional tags should be passed as `children` of `<Head>` element */}
			</Head>
			<body>
				<Layout
					navbar={navbar}
					pageMap={await getPageMap()}
					docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
					footer={footer}
					// ... Your additional layout options
				>
					{children}
				</Layout>
			</body>
		</html>
	);
}

import { generateStaticParamsFor, importPage } from "nextra/pages";

import { useMDXComponents as getThemeComponents } from "../../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

type Props = {
	params: Promise<{ mdxPath: string[] }>;
};

export async function generateMetadata(props: Props) {
	const params = await props.params;
	const { metadata } = await importPage(params.mdxPath);
	return metadata;
}

const Wrapper = getThemeComponents().wrapper;

export default async function Page(props: Props) {
	const params = await props.params;
	const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath);
	return (
		<Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
			<MDXContent {...props} params={params} />
		</Wrapper>
	);
}

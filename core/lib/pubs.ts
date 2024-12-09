export type PubTitleProps = { title?: string | null; createdAt: Date } & {
	pubType: { name: string };
};

export const getPubTitle = (pub: PubTitleProps): string => {
	const fallbackTitle = `Untitled ${pub.pubType.name} - ${new Date(pub.createdAt).toDateString()}`;

	return pub.title ?? fallbackTitle;
};

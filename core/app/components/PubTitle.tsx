import type { PubTitleProps } from "~/lib/pubs";
import { getPubTitle } from "~/lib/pubs";

export const PubTitle = (props: { pub: PubTitleProps }) => {
	const title = getPubTitle(props.pub);
	return <h3 className="text-md font-semibold">{title}</h3>;
};

import type { PubTitleProps } from "~/lib/pubs";
import { getPubTitle } from "~/lib/pubs";

type Props = {
	pub: PubTitleProps;
};
export const PubTitle: React.FC<Props> = function (props: Props) {
	const title = getPubTitle(props.pub);
	return <h3 className="text-md font-semibold">{title}</h3>;
};

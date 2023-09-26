import { PubPayload } from "~/lib/types";

type Props = {
	pub: PubPayload;
};
export const PubTitle: React.FC<Props> = function (props: Props) {
	const titleValue = props.pub.values.find((value) => {
		return value.field.name === "Title";
	});
	const title = titleValue?.value as string;
	return <h3 className="text-md font-semibold">{title}</h3>;
};

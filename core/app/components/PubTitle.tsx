import type { PubValuesPayload } from "~/lib/types";

type Props = {
	pub: PubValuesPayload;
};
export const PubTitle: React.FC<Props> = function (props: Props) {
	const titleValue = props.pub.values.find((value) => {
		return value.field.slug.includes("title") && value.value;
	});
	const title = titleValue?.value as string;
	return (
		<h3 className="text-md font-semibold">
			{title ?? `Untitled Pub - ${props.pub.createdAt.toDateString()}`}{" "}
		</h3>
	);
};

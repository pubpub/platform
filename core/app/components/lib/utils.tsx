import Link from "next/link";
import { PubPayload } from "~/lib/types";

export const renderPubTitle = (pub: PubPayload) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	const title = titleValue?.value as string;
	return (
		<h3 className="text-md font-semibold">
			<Link href={`pubs/${pub.slug}` ?? "jkjk"}>{title}</Link>
		</h3>
	);
};

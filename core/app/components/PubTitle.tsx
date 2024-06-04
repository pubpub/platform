type Props = {
	pub: {
		id: string;
		values: { field: { slug: string }; value: unknown }[] | Record<string, unknown>;
		createdAt: Date;
	};
};
export const PubTitle: React.FC<Props> = function (props: Props) {
	const title = (
		Array.isArray(props.pub.values)
			? props.pub.values.find((value) => {
					return value.field.slug.includes("title") && value.value;
				})?.value
			: props.pub.values["pubpub:title"]
	) as string | undefined;
	return (
		<h3 className="text-md font-semibold">
			{title ?? `Untitled Pub - ${new Date(props.pub.createdAt).toDateString()}`}{" "}
		</h3>
	);
};

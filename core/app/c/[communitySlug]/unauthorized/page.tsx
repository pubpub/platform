import Link from "next/link";

type Props = {
	params: {
		communitySlug: string;
	};
};

export default async function Page(props: Props) {
	return (
		<div>
			<h1>Unauthorized</h1>
			<p>
				<Link href={`/c/${props.params.communitySlug}`}>Go Home</Link>
			</p>
		</div>
	);
}

import { notFound } from "next/navigation";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	if (!(instanceId && pubId)) {
		notFound();
	}
	// TODO: Get copy from Jeff/Gabe
	return (
		<div className="prose max-w-none">
			<p>
				Thanks for accepting! We'll send you an email with instructions on how to submit
				your evaluation.
			</p>
		</div>
	);
}

import Link from "next/link";

import { actions } from "~/actions/api";

type Props = {
	params: {
		communitySlug: string;
	};
};

export default async function Page(props: Props) {
	return (
		<div className="container mx-auto px-4 py-12 md:px-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Action Settings</h1>
					<p className="text-muted-foreground">
						Set default configuration values for your actions. These defaults will be
						applied to new instances of actions in your community.
					</p>
				</div>
				{Object.values(actions).map((action) => (
					<Link
						key={action.name}
						href={`/c/${props.params.communitySlug}/settings/actions/${action.name}`}
						as={`/c/${props.params.communitySlug}/settings/actions/${action.name}`}
					>
						<div className="rounded border p-4 hover:bg-gray-50">
							<h2 className="text-xl font-semibold">{action.name}</h2>
							<p className="text-muted-foreground">{action.description}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}

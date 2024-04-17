import Link from "next/link";

import { Button } from "ui/button";

type Props = {};

const PubHeader: React.FC<Props> = function ({}) {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="text-xl font-bold">Pubs</h1>
			<Button variant="outline" size="sm" asChild>
				<Link href="types">Manage Types</Link>
			</Button>
		</div>
	);
};
export default PubHeader;

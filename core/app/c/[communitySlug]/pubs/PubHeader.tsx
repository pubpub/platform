import Link from "next/link";

import { Button } from "ui/button";

import { PubCRUDButton } from "~/app/components/PubCRUD/PubCRUDButton";

const PubHeader = () => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<PubCRUDButton method="create" />
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
export default PubHeader;

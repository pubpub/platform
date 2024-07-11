import type { FormsId } from "db/public/Forms";
import { Button } from "ui/button";
import { Archive } from "ui/icon";

type Props = {
	id: FormsId;
};

export const ArchiveFormButton = ({ id }: Props) => (
	<Button variant="ghost" size="sm" className="flex gap-2">
		<Archive size={12} className="mr-2" />
		Archive
	</Button>
);

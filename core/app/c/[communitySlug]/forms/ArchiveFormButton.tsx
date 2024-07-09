import { Button } from "ui/button";
import { Archive } from "ui/icon";

import type { FormsId } from "~/kysely/types/public/Forms";

type Props = {
	id: FormsId;
};

export const ArchiveFormButton = ({ id }: Props) => (
	<Button variant="ghost" size="sm" className="flex gap-2">
		<Archive size={12} className="mr-2" />
		Archive
	</Button>
);

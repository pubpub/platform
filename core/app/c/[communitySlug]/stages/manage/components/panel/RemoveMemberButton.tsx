"use client";

import type { StagesId, UsersId } from "db/public";
import { Button } from "ui/button";
import { Trash } from "ui/icon";

import { useServerAction } from "~/lib/serverActions";
import { removeStageMember } from "../../actions";

export const RemoveMemberButton =
	({ stageId }: { stageId: StagesId }) =>
	({ userId }: { userId: UsersId }) => {
		const runRemoveMember = useServerAction(removeStageMember);

		return (
			<Button
				type="button"
				variant="ghost"
				onClick={async () => await runRemoveMember(userId, stageId)}
			>
				<Trash size={14} />
			</Button>
		);
	};

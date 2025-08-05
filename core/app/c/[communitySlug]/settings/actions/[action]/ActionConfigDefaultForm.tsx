"use client";

import type { z } from "zod";

import { useCallback, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

import type { Action, CommunitiesId } from "db/public";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";

import { getActionByName } from "~/actions/api";
import { updateActionConfigDefault } from "./actions";

type Props = {
	action: Action;
	communityId: CommunitiesId;
	values?: Record<string, unknown>;
};

export const ActionConfigDefaultForm = (props: Props) => {
	const [isPending, startTransition] = useTransition();
	const action = useMemo(() => getActionByName(props.action), [props.action]);
	const onSubmit = useCallback((values: z.infer<typeof action.config.schema>) => {
		startTransition(async () => {
			await updateActionConfigDefault(props.communityId, props.action, values);
		});
	}, []);

	return (
		<AutoForm
			values={props.values ?? {}}
			formSchema={action.config.schema}
			dependencies={action.config.dependencies}
			onSubmit={onSubmit}
		>
			<AutoFormSubmit disabled={isPending} className="flex items-center gap-x-2">
				{isPending ? <Loader2 size="14" className="animate-spin" /> : "Submit"}
			</AutoFormSubmit>
		</AutoForm>
	);
};

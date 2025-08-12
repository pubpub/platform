"use client";

import type { z } from "zod";

import { useCallback, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

import type { Action, CommunitiesId } from "db/public";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { didSucceed } from "~/lib/serverActions";
import { updateActionConfigDefault } from "./actions";

type Props = {
	action: Action;
	communityId: CommunitiesId;
	values?: Record<string, unknown>;
};

export const ActionConfigDefaultForm = (props: Props) => {
	const [isPending, startTransition] = useTransition();
	const action = useMemo(() => getActionByName(props.action), [props.action]);
	const schema = useMemo(() => action.config.schema.partial(), [action.config.schema]);
	const onSubmit = useCallback((values: z.infer<typeof schema>) => {
		startTransition(async () => {
			const result = await updateActionConfigDefault(props.action, values);
			if (didSucceed(result)) {
				toast({
					title: "Success",
					description: "Action config defaults updated",
				});
			}
		});
	}, []);

	return (
		<AutoForm
			values={props.values ?? {}}
			formSchema={schema}
			dependencies={action.config.dependencies}
			onSubmit={onSubmit}
		>
			<AutoFormSubmit disabled={isPending} className="flex items-center gap-x-2">
				{isPending ? <Loader2 size="14" className="animate-spin" /> : "Submit"}
			</AutoFormSubmit>
		</AutoForm>
	);
};

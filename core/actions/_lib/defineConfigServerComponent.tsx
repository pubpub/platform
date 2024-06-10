import type React from "react";

import type { Action } from "../types";
import type ActionInstances from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";

export type ActionFormFieldBaseProps<Type extends "config" | "params"> = {
	actionInstance: ActionInstances;
	communityId: CommunitiesId;
	stageId: StagesId;
} & (Type extends "params"
	? {
			pubId: PubsId;
		}
	: { pubId?: never });

export const defineActionFormFieldServerComponent = <
	T extends Action,
	Type extends "config" | "params",
>(
	action: T,
	type: Type,
	FormField: ({
		action,
		actionInstance,
		stageId,
		communityId,
	}: ActionFormFieldBaseProps<Type> & {
		action: T;
	}) => Promise<React.ReactNode>
) => {
	const serverComponent = async (props: ActionFormFieldBaseProps<Type>) => {
		const F = await FormField({
			action,
			...props,
		});

		return F;
	};

	return serverComponent;
};

export type ActionConfigServerComponent<
	T extends Action,
	Type extends "config" | "params",
> = ReturnType<typeof defineActionFormFieldServerComponent<T, Type>>;

import type { ActionInstances } from "db/public/ActionInstances";
import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { StagesId } from "db/public/Stages";
import type React from "react";

import type { Action } from "../../types";

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
	}) => Promise<React.AwaitedReactNode>
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

export type ActionConfigServerComponentProps<Type extends "config" | "params"> =
	ActionFormFieldBaseProps<Type>;

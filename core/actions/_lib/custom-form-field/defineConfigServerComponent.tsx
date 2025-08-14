import "server-only";

import type React from "react";

import type { CommunitiesId, PubsId, StagesId } from "db/public";

import type { Action, ActionInstanceOf } from "../../types";

export type ActionFormFieldBaseProps<T extends Action, Type extends "config" | "params"> = {
	config?: ActionInstanceOf<T>["config"];
	communityId: CommunitiesId;
	stageId?: StagesId;
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
		config,
		stageId,
		communityId,
	}: ActionFormFieldBaseProps<T, Type> & {
		action: T;
	}) => Promise<React.ReactNode>
) => {
	const serverComponent = async (props: ActionFormFieldBaseProps<T, Type>) => {
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

export type ActionConfigServerComponentProps<
	T extends Action,
	Type extends "config" | "params",
> = ActionFormFieldBaseProps<T, Type>;

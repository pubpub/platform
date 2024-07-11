import type React from "react";

import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { StagesId } from "db/public/Stages";

import type { Action, ActionInstanceOf } from "../../types";
import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";

export type ActionFormFieldBaseProps<T extends Action, Type extends "config" | "params"> = {
	actionInstance: ActionInstanceOf<T>;
	communityId: CommunitiesId;
	stageId: StagesId;
	pageContext: PageContext;
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
		pageContext,
	}: ActionFormFieldBaseProps<T, Type> & {
		action: T;
	}) => Promise<React.AwaitedReactNode>
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

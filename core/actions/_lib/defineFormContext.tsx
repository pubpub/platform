import React from "react";

import type { Action } from "../types";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { PubsId } from "~/kysely/types/public/Pubs";
import { FormContextClientInnerContext } from "./defineFormContextClientInner";

type SharedContextProps<A extends Action = Action> = {
	/**
	 * The id of the stage the actionInstance is in
	 */
	stageId: StagesId;
	/**
	 * The id of the community the actionInstance is in
	 */
	communityId: CommunitiesId;
	/**
	 * The actionInstance you are configuring/running
	 */
	actionInstance: ActionInstances;
};

type RunActionContextProps<A extends Action = Action> = SharedContextProps<A> & {
	/**
	 * The id of the pub you are running the action on
	 */
	pubId: string;
};

type ContextProps<A extends Action, T extends "config" | "params"> = T extends "config"
	? SharedContextProps<A>
	: SharedContextProps<A> & {
			/**
			 * The id of the pub you are running the action on
			 */
			pubId: PubsId;
		};

type X = Omit<ContextProps<Action, "config"> & { children: React.ReactNode }, "children">;
type Y = ContextProps<Action, "config">;

type ContextPropsWithChildren<A extends Action, T extends "config" | "params"> = ContextProps<
	A,
	T
> & { children: React.ReactNode };

export const defineActionContext = <
	A extends Action,
	T extends "config" | "params",
	C extends Record<string, unknown>,
>(
	/**
	 * The action
	 */
	action: A,
	type: T,
	/**
	 * The context.
	 *
	 * This is the same context you use when using `useContext()` in the custom field
	 */
	context: C,
	/**
	 * The function that returns the value the context will be populated by
	 *
	 * **WARNING**: The output of this function MUST be seriazable, as it will be
	 * passed from the server to the client!
	 *
	 * The only exception is that you can pass server actions, but try to avoid
	 * doing so, as you fields in a form should probably not be able to change
	 * the state of the server on their own without submitting the form.
	 */
	createContextValueFunction: (
		props: Omit<ContextPropsWithChildren<A, T>, "children"> & { action: A }
	) => Promise<C>
): ActionContext<A, T> => {
	return async ({ children, ...props }: ContextPropsWithChildren<A, T>) => {
		const contextValue = await createContextValueFunction({ action, ...props });

		return (
			<FormContextClientInnerContext context={contextValue}>
				{children}
			</FormContextClientInnerContext>
		);
	};
};

export type ActionContext<A extends Action, T extends "config" | "params"> = (
	props: ContextPropsWithChildren<A, T>
) => Promise<JSX.Element>;

// export const defineConfigActionContext = <A extends Action, C>(
// 	/**
// 	 * The action
// 	 */
// 	action: A,
// 	/**
// 	 * The context.
// 	 *
// 	 * This is the same context you use when using `useContext()` in the custom field
// 	 */
// 	RunActionContext: React.Context<C>,
// 	/**
// 	 * The function that returns the value the context will be populated by
// 	 *
// 	 * **WARNING**: The output of this function MUST be seriazable, as it will be
// 	 * passed from the server to the client!
// 	 *
// 	 * The only exception is that you can pass server actions, but try to avoid
// 	 * doing so, as you fields in a form should probably not be able to change
// 	 * the state of the server on their own without submitting the form.
// 	 */
// 	createContextValueFunction: (props: SharedContextProps<A>) => Promise<C>
// ) => {
// 	return async ({
// 		actionInstance,
// 		stageId,
// 		communityId,
// 		children,
// 	}: SharedContextProps<A> & { children: React.ReactNode }) => {
// 		const contextValue = await createContextValueFunction({
// 			action,
// 			actionInstance,
// 			stageId,
// 			communityId,
// 		});

// 		return (
// 			<RunActionContext.Provider value={contextValue}>{children}</RunActionContext.Provider>
// 		);
// 	};
// };

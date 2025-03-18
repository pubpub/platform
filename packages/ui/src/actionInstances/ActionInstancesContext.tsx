"use client";

import type { JSX } from "react";

import React, { createContext, useContext } from "react";

import type { Action, ActionInstances } from "db/public";

type ActionType = {
	name: Action;
	config: {
		schema: Record<string, any>;
	};
	description: string;
	params: {
		schema: Record<string, any>;
	};
	icon: (props: any) => React.ReactNode | JSX.Element;
	superAdminOnly?: boolean;
	experimental?: boolean;
	tokens?: Record<string, string[]>;
};

export type ActionInstanceContext = {
	actions: Record<string, ActionType>;
	actionInstances: ActionInstances[];
};

type Props = {
	children: React.ReactNode;
} & ActionInstanceContext;

const ActionInstanceContext = createContext<ActionInstanceContext>({
	actions: {},
	actionInstances: [],
});

export function ActionInstanceProvider({ children, actionInstances, actions }: Props) {
	return (
		<ActionInstanceContext.Provider value={{ actions, actionInstances }}>
			{children}
		</ActionInstanceContext.Provider>
	);
}

export const useActionInstanceContext = () => useContext(ActionInstanceContext);

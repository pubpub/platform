"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useContext } from "react";

import type { Stages } from "db/public";

import type { FormElementData, PanelEvent } from "./types";

type BuilderContext<T extends Record<string, unknown> = Record<string, unknown>> = {
	addElement: (element: T) => void;
	removeElement: (index: number) => void;
	restoreElement: (index: number) => void;
	newElement?: number;
	elementsCount: number;
	selectedElement?: T;
	openConfigPanel: (index: number) => void;
	openButtonConfigPanel: (id?: string) => void;
	update: (index: number, element: T) => void;
	removeIfUnconfigured: () => void;
	dispatch: React.Dispatch<PanelEvent>;
	identity: string;
	stages: Stages[];
	isDirty: boolean;
};

const BuilderContext = createContext<BuilderContext<Record<string, any>> | undefined>(undefined);

export const useBuilder = <T extends Record<string, unknown> = Record<string, unknown>>() => {
	const context = useContext(BuilderContext) as BuilderContext<T>;
	if (!context) {
		throw new Error("Builder context used before initialization");
	}

	return context;
};

type BuilderProviderProps<T extends Record<string, unknown> = Record<string, unknown>> =
	PropsWithChildren<BuilderContext<T>>;

export const BuilderProvider = <T extends Record<string, unknown> = Record<string, unknown>>(
	props: BuilderProviderProps<T>
) => {
	const { children, ...value } = props;
	return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
};

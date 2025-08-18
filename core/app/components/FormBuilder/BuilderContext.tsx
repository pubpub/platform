"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useContext, useMemo } from "react";

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

const BuilderContext = createContext<BuilderContext | undefined>(undefined);

export const useBuilder = <T extends Record<string, unknown>>() => {
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
	const builderContext = useMemo(
		() => BuilderContext as React.Context<BuilderContext<T> | undefined>,
		[]
	);

	return <builderContext.Provider value={value}>{children}</builderContext.Provider>;
};

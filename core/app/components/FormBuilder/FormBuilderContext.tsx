"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useContext } from "react";

import type { Stages } from "db/public";

import type { FormElementData, PanelEvent } from "./types";

type FormBuilderContext = {
	addElement: (element: FormElementData) => void;
	removeElement: (index: number) => void;
	restoreElement: (index: number) => void;
	newElement?: number;
	elementsCount: number;
	selectedElement?: FormElementData;
	openConfigPanel: (index: number) => void;
	openButtonConfigPanel: (id?: string) => void;
	update: (index: number, element: FormElementData) => void;
	removeIfUnconfigured: () => void;
	dispatch: React.Dispatch<PanelEvent>;
	slug: string;
	stages: Stages[];
};

const FormBuilderContext = createContext<FormBuilderContext | undefined>(undefined);

export const useFormBuilder = () => {
	const context = useContext(FormBuilderContext);
	if (!context) {
		throw new Error("Form builder context used before initialization");
	}

	return context;
};

type FormBuilderProviderProps = PropsWithChildren<FormBuilderContext>;

export const FormBuilderProvider = (props: FormBuilderProviderProps) => {
	const { children, ...value } = props;
	return <FormBuilderContext.Provider value={value}>{children}</FormBuilderContext.Provider>;
};

"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useContext } from "react";

import type { FormElementData } from "./types";

type FormBuilderContext = {
	addElement: (element: FormElementData) => void;
	removeElement: (index: number) => void;
	restoreElement: (index: number) => void;
	setEditingElement: (index: number | null) => void;
	editingElement?: FormElementData;
	elementsCount: number;
	openConfigPanel: () => void;
	update: (index: number, element: FormElementData) => void;
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

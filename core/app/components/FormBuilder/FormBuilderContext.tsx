"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useCallback, useContext } from "react";

import type { FormBuilderSchema } from "./types";

type FormBuilderContext = {
	submit: () => void;
	addElement: (element: FormBuilderSchema["elements"][0]) => void;
	removeElement: (index: number) => void;
	setEditingElement: (index: number | null) => void;
	editingElement?: FormBuilderSchema["elements"][0];
	elementsCount: number;
	openConfigPanel: () => void;
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

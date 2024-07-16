"use client";

import type { PropsWithChildren } from "react";

import * as React from "react";
import { createContext, useCallback, useContext } from "react";

import type { FormElementData } from "./types";

type FormBuilderContext = {
	submit: () => void;
	addElement: (element: FormElementData) => void;
	removeElement: (index: number) => void;
	setEditingElement: (index: number) => void;
	editingElement?: FormElementData;
	elementsCount: number;
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

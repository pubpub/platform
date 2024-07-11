"use client";

import React, { createContext, useContext } from "react";

import type { PubFields, PubFieldsId } from "db/public/PubFields";

export type PubFieldContext = Record<PubFieldsId, PubFields>;

type Props = {
	children: React.ReactNode;
	pubFields: PubFieldContext;
};

const PubFieldContext = createContext<PubFieldContext>({});

export function PubFieldProvider({ children, pubFields }: Props) {
	return <PubFieldContext.Provider value={pubFields}>{children}</PubFieldContext.Provider>;
}

export const usePubFieldContext = () => useContext(PubFieldContext);

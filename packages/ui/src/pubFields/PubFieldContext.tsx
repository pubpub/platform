"use client";

import type { CoreSchemaType } from "schemas";

import React, { createContext, useContext } from "react";

// TODO: Replace with the actual types once the db package is separated out
type PubFieldsId = string & { __brand: "PubFieldsId" };
type PubFieldSchemaId = string & { __brand: "PubFieldSchemaId" };

export type PubField = {
	id: PubFieldsId;
	name: string;
	pubFieldSchemaId: PubFieldSchemaId | null;
	slug: string;
	schemaName: CoreSchemaType | null;
};

export type PubFieldContext = Record<PubFieldsId, PubField>;

type Props = {
	children: React.ReactNode;
	pubFields: PubFieldContext;
};

const PubFieldContext = createContext<PubFieldContext>({});

export function PubFieldProvider({ children, pubFields }: Props) {
	return <PubFieldContext.Provider value={pubFields}>{children}</PubFieldContext.Provider>;
}

export const usePubFieldContext = () => useContext(PubFieldContext);

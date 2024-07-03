"use client";

import React, { createContext, useContext } from "react";

// TODO: Replace with the actual types once the db package is separated out
type PubFieldsId = string & { __brand: "PubFieldsId" };
type PubFieldSchemaId = string & { __brand: "PubFieldSchemaId" };
enum CoreSchemaType {
	String = "String",
	Boolean = "Boolean",
	Vector3 = "Vector3",
	DateTime = "DateTime",
	Email = "Email",
	URL = "URL",
	UserId = "UserId",
	FileUpload = "FileUpload",
}

type PubField = {
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

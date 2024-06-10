"use client";

import { createContext, useContext } from "react";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";

type Props = {
	children: React.ReactNode;
	fields: Field[];
};

type Field = {
	id: PubFieldsId;
	slug: string;
	name: string;
};

const FieldsContext = createContext<Field[]>([]);

export function FieldsProvider({ children, fields }: Props) {
	return <FieldsContext.Provider value={fields}>{children}</FieldsContext.Provider>;
}

export const useFields = () => useContext(FieldsContext);

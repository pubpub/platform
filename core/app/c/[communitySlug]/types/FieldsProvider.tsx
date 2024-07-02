"use client";

import { createContext, useContext } from "react";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";

type Props = {
	children: React.ReactNode;
	fields: Record<PubFieldsId, PubField>;
};

const FieldsContext = createContext<Record<PubFieldsId, PubField>>({});

export function FieldsProvider({ children, fields }: Props) {
	return <FieldsContext.Provider value={fields}>{children}</FieldsContext.Provider>;
}

export const useFields = () => useContext(FieldsContext);

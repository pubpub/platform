"use client";

import React, { createContext, useContext } from "react";

import type { PubTypes } from "db/public";

type Props = {
	children: React.ReactNode;
	pubTypes: PubTypes[];
};

const PubTypeContext = createContext<PubTypes[]>([]);

export function PubTypeProvider({ children, pubTypes }: Props) {
	return <PubTypeContext.Provider value={pubTypes}>{children}</PubTypeContext.Provider>;
}

export const usePubTypeContext = () => useContext(PubTypeContext);

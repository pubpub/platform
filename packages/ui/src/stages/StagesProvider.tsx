"use client";

import React, { createContext, useContext } from "react";

import type { Stages } from "db/public";

import type { StagesDAO } from "./StagesDAO";

type Props = {
	children: React.ReactNode;
	stages: StagesDAO[];
};

const StagesContext = createContext<Stages[] | null>(null);

export function StagesProvider({ children, stages }: Props) {
	return <StagesContext.Provider value={stages}>{children}</StagesContext.Provider>;
}

export const useStages = () => {
	const stages = useContext(StagesContext);
	if (!stages) {
		throw new Error("Stages context used without provider");
	}
	return stages;
};

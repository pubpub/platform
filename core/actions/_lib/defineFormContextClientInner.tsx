"use client";

import React from "react";

export const BlankContext = React.createContext({});

export const FormContextClientInnerContext = <C extends Record<string, unknown>>({
	context,
	children,
}: {
	children: React.ReactNode;
	context: C;
}) => {
	return <BlankContext.Provider value={context}>{children}</BlankContext.Provider>;
};

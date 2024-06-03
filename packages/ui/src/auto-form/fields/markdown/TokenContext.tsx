import React, { createContext, PropsWithChildren, useContext } from "react";

export type TokenContext = {
	staticTokens: string[];
	dynamicTokens: RegExp | null;
};

export const TokenContext = createContext<TokenContext>({
	staticTokens: [],
	dynamicTokens: /^.$/,
});

export const useTokenContext = () => {
	return useContext(TokenContext);
};

export function TokenProvider(props: PropsWithChildren<TokenContext>) {
	return <TokenContext.Provider value={props}>{props.children}</TokenContext.Provider>;
}

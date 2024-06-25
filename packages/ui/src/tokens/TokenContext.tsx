import type { PropsWithChildren} from "react";
import React, { createContext, useContext } from "react";

export type TokenContext = {
	[scope: string]: {
		[token: string]: {
			description: string;
		};
	};
};

export const TokenContext = createContext<TokenContext>({});

export const useTokenContext = () => {
	return useContext(TokenContext);
};

export function TokenProvider(props: PropsWithChildren<{ tokens: TokenContext }>) {
	return <TokenContext.Provider value={props.tokens}>{props.children}</TokenContext.Provider>;
}

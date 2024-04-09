import { createContext } from "react";

import { User } from "contracts";

export type IntegrationContext<T> = {
	name: string;
	user: User;
	config?: T;
};

export const IntegrationContext = createContext<IntegrationContext<unknown>>({
	name: "",
	user: null!,
	config: null,
});

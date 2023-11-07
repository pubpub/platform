import { User } from "contracts";
import { createContext } from "react";

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

import { User } from "contracts";
import { createContext } from "react";

export type IntegrationContext = {
	name: string;
	user: User;
	instance: unknown;
};

export const IntegrationContext = createContext<IntegrationContext>({
	name: "",
	user: null!,
	instance: null,
});

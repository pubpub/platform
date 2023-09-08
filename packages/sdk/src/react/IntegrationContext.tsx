"use client";

import { createContext } from "react";
import { User } from "../lib";

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

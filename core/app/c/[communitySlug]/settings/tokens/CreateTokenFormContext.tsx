"use client";

import { createContext } from "react";

import type { CreateTokenFormContext as CreateTokenFormContextType } from "db/types";

export const CreateTokenFormContext = createContext<CreateTokenFormContextType>({
	stages: [],
	pubTypes: [],
});

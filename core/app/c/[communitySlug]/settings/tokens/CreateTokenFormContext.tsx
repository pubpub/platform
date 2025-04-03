"use client";

import { createContext } from "react";

import type { CreateTokenFormContext as CreateTokenFormContextType } from "db/types";
import { NO_STAGE_OPTION } from "db/types";

export const CreateTokenFormContext = createContext<CreateTokenFormContextType>({
	stages: {
		stages: [],
		allOptions: [NO_STAGE_OPTION],
		allValues: [NO_STAGE_OPTION.value],
	},
	pubTypes: {
		pubTypes: [],
		allOptions: [],
		allValues: [],
	},
});

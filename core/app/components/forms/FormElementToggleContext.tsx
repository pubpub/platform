"use client";

import type { PropsWithChildren } from "react";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type FormElementToggleContext = {
	isEnabled: (field: string) => boolean;
	toggle: (field: string) => void;
};

const FormElementToggleContext = createContext<FormElementToggleContext>({
	isEnabled: () => true,
	toggle: () => {},
});

type Props = PropsWithChildren<{
	fields: string[];
}>;

export const FormElementToggleProvider = (props: Props) => {
	const [enabledFields, setEnabledFields] = useState(new Set(props.fields));

	const isEnabled = useCallback(
		(field: string) => {
			return enabledFields.has(field);
		},
		[enabledFields]
	);

	const toggle = useCallback(
		(field: string) => {
			const nextEnabledFields = new Set(enabledFields);
			if (nextEnabledFields.has(field)) {
				nextEnabledFields.delete(field);
			} else {
				nextEnabledFields.add(field);
			}
			setEnabledFields(nextEnabledFields);
		},
		[enabledFields]
	);

	const value = useMemo(() => ({ isEnabled, toggle }), [isEnabled, toggle, enabledFields]);

	return (
		<FormElementToggleContext.Provider value={value}>
			{props.children}
		</FormElementToggleContext.Provider>
	);
};

export const useFormElementToggleContext = () => useContext(FormElementToggleContext);

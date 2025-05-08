"use client";

import type { Dispatch, PropsWithChildren, SetStateAction } from "react";

import { createContext, useContext, useMemo, useState } from "react";

import type { Form } from "~/lib/server/form";

export type FormSwitcherContext = {
	selectedForm?: Form;
	setSelectedForm: Dispatch<SetStateAction<Form | undefined>>;
};

const FormSwitcherContext = createContext<FormSwitcherContext>({
	setSelectedForm: () => {},
});

type Props = PropsWithChildren<{
	defaultForm?: Form;
}>;

export const FormSwitcherProvider = ({ defaultForm, children }: Props) => {
	const [selectedForm, setSelectedForm] = useState(defaultForm);

	const value = useMemo(
		() => ({ selectedForm, setSelectedForm }),
		[selectedForm, setSelectedForm]
	);

	return <FormSwitcherContext.Provider value={value}>{children}</FormSwitcherContext.Provider>;
};

export const useFormSwitcherContext = () => useContext(FormSwitcherContext);

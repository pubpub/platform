import type { Meta, StoryObj } from "@storybook/react";

import React, { useState } from "react";
import { expect, fn, userEvent, within } from "@storybook/test";

import { MultiValueInput } from "../multivalue-input";

const meta: Meta<typeof MultiValueInput> = {
	title: "MultiValueInput",
	component: MultiValueInput,
	tags: ["autodocs"],
	argTypes: {},
	args: { onChange: fn(), values: [] },
};
export default meta;

type Story = StoryObj<typeof MultiValueInput>;

export const Base: Story = {
	args: {},
};

export const WithValues: Story = {
	args: { values: ["cat", "dog"] },
};

export const Interactive: Story = {
	args: {},
	render: () => {
		const [values, setValues] = useState<string[]>([
			"cat",
			"dog",
			"squirrel",
			"alligator",
			"wolf",
			"otter",
			"seal",
			"mouse",
			"turtle",
			"lion",
			"tiger",
			"bobcat",
		]);
		return <MultiValueInput values={values} onChange={setValues} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Remove an element
		const bobcat = within(canvas.getByTestId("sortable-value-bobcat"));
		await userEvent.click(bobcat.getByTestId("remove-button"));
		expect(canvas.queryByTestId("sortable-value-bobcat")).not.toBeInTheDocument();

		// Add an element
		// NOTE: this test never seems to work the first time it renders inside storybook
		// but does succeed in subsequent runs
		const input = canvas.getByTestId("multivalue-input");
		await userEvent.type(input, "snake{enter}");
		await expect(canvas.getByTestId("sortable-value-snake")).toBeInTheDocument();
	},
};

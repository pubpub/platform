import type { Meta, StoryObj } from "@storybook/react";

import React, { useState } from "react";
import { fn } from "@storybook/test";

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

export const WithManyValues: Story = {
	args: {
		values: [
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
		],
	},
};

export const Interactive = () => {
	const [values, setValues] = useState<string[]>([]);
	return <MultiValueInput values={values} onChange={setValues} />;
};

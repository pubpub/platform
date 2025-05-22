import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { PubCard } from "ui/pubs";

import pub from "../fixtures/pub.json";

const meta: Meta<typeof PubCard> = {
	title: "PubCard",
	component: PubCard,
	tags: ["autodocs"],
	argTypes: {},
	args: { pub: pub },
};
export default meta;

type Story = StoryObj<typeof PubCard>;

export const Base: Story = {
	args: {},
};

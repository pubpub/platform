import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { PubRowSkeleton } from "~/app/components/PubRow";
import pub from "./assets/pub.json";

const meta: Meta<typeof PubRowSkeleton> = {
	title: "PubCard",
	component: PubRowSkeleton,
	tags: ["autodocs"],
	argTypes: {},
	args: { pub: pub },
};
export default meta;

type Story = StoryObj<typeof PubRowSkeleton>;

export const Base: Story = {
	args: {},
};

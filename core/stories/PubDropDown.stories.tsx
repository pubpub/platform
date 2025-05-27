import type { Meta, StoryObj } from "@storybook/react";

import { PubDropDown } from "~/app/components/pubs/PubDropDown";

const meta: Meta<typeof PubDropDown> = {
	title: "PubDropDown",
	component: PubDropDown,
	tags: ["autodocs"],
	argTypes: {},
	args: { pubId: "123", searchParams: { communitySlug: "test" } },
};
export default meta;

type Story = StoryObj<typeof PubDropDown>;

export const Base: Story = {
	args: {},
};

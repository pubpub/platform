import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import type { ProcessedPub } from "contracts";
import { Button } from "ui/button";

import { PubCard } from "~/app/components/PubCard";
import pubJson from "./assets/pub.json";

const pub = {
	...pubJson,
	createdAt: new Date(pubJson.createdAt),
	updatedAt: new Date(pubJson.updatedAt),
} as unknown as ProcessedPub<{
	withPubType: true;
	withRelatedPubs: false;
	withStage: true;
}>;

const meta: Meta<typeof PubCard> = {
	title: "PubCard",
	component: PubCard,
	tags: ["autodocs"],
	argTypes: {},
	args: { pub: pub, communitySlug: "test-community", actions: <Button>Actions</Button> },
};
export default meta;

type Story = StoryObj<typeof PubCard>;

export const Base: Story = {
	args: {},
};

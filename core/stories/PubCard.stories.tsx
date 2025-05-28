import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import type { ProcessedPub } from "contracts";
import { Button } from "ui/button";

import type { CommunityStage } from "~/lib/server/stages";
import { PubCard } from "~/app/components/PubCard";
import pubJson from "./assets/pub.json";
import stagesJson from "./assets/stages.json";

const pub = {
	...pubJson,
	createdAt: new Date(pubJson.createdAt),
	updatedAt: new Date(pubJson.updatedAt),
} as unknown as ProcessedPub<{
	withPubType: true;
	withRelatedPubs: false;
	withStage: true;
}>;

const stages = stagesJson as unknown as CommunityStage[];

const meta: Meta<typeof PubCard> = {
	title: "PubCard",
	component: PubCard,
	tags: ["autodocs"],
	argTypes: {},
	args: { pub: pub, communitySlug: "test-community", stages },
	parameters: {
		nextjs: {
			appDirectory: true,
		},
	},
};
export default meta;

type Story = StoryObj<typeof PubCard>;

export const Base: Story = {
	args: {},
};

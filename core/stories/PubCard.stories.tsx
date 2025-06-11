import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Suspense } from "react";

// import { fn } from "storybook/test";

import type { ProcessedPub } from "contracts";
import type { ActionInstancesId, CommunitiesId } from "db/public";
import { Action } from "db/public";

// import { Button } from "ui/button";

import type { CommunityStage } from "~/lib/server/stages";
import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { PubCard } from "~/app/components/PubCard";
import { RootToaster } from "~/app/RootToaster";
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
	args: {
		pub: pub,
		communitySlug: "test-community",
		stages,
		actionInstances: [
			{
				action: Action.log,
				stageId: stages[0].id,
				config: {},
				id: "1" as ActionInstancesId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: "test",
			},
		],
	},
	parameters: {
		nextjs: {
			appDirectory: true,
		},
	},
	render: (args) => {
		return (
			<CommunityProvider
				community={{
					id: "1" as CommunitiesId,
					avatar: null,
					name: "test",
					slug: "test",
					createdAt: new Date(),
					updatedAt: new Date(),
				}}
			>
				<PubCard {...args} />
			</CommunityProvider>
		);
	},
};
export default meta;

type Story = StoryObj<typeof PubCard>;

export const Base: Story = {
	args: {},
};

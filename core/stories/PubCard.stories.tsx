import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ProcessedPub } from "contracts"
import type {
	ActionInstancesId,
	AutomationsId,
	AutomationTriggersId,
	CommunitiesId,
	StagesId,
} from "db/public"
import type { CommunityStage } from "~/lib/server/stages"

import { Action, AutomationEvent } from "db/public"

import { CommunityProvider } from "~/app/components/providers/CommunityProvider"
import { PubCardServer } from "~/app/components/pubs/PubCard/PubCardServer"
import pubJson from "./assets/pub.json"
import stagesJson from "./assets/stages.json"

const pub = {
	...pubJson,
	createdAt: new Date(pubJson.createdAt),
	updatedAt: new Date(pubJson.updatedAt),
} as unknown as ProcessedPub<{
	withPubType: true
	withRelatedPubs: false
	withStage: true
}>

const _stages = stagesJson as unknown as CommunityStage[]

const meta: Meta<typeof PubCardServer> = {
	title: "PubCard",
	component: PubCardServer,
	tags: ["autodocs"],
	argTypes: {},
	args: {
		pub: pub,
		communitySlug: "test-community",
		moveFrom: [],
		moveTo: [],
		manualAutomations: [
			{
				id: "1" as AutomationsId,
				name: "test",
				triggers: [
					{
						event: AutomationEvent.manual,
						config: {},
						id: "1" as AutomationTriggersId,
						createdAt: new Date(),
						updatedAt: new Date(),
						automationId: "1" as AutomationsId,
						sourceAutomationId: null,
					},
				],
				actionInstances: [
					{
						id: "1" as ActionInstancesId,
						createdAt: new Date(),
						updatedAt: new Date(),
						automationId: "1" as AutomationsId,
						action: Action.log,
						config: {},
						defaultedActionConfigKeys: null,
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
				communityId: "1" as CommunitiesId,
				description: null,
				stageId: "1" as StagesId,
				conditionEvaluationTiming: null,
				icon: null,
				condition: null,
				resolver: null,
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
				<PubCardServer {...args} />
			</CommunityProvider>
		)
	},
}
export default meta

type Story = StoryObj<typeof PubCardServer>

export const Base: Story = {
	args: {},
}

export const WithSelection: Story = {
	args: {
		withSelection: true,
	},
}

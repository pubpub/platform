import type { CommunitiesId, StagesId, UsersId } from "db/public";

import { Suspense } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "ui/empty";
import { Bot } from "ui/icon";
import { ItemGroup } from "ui/item";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageAutomations } from "~/lib/db/queries";
import { StagePanelCardHeader } from "../../editor/StagePanelCard";
import { StagePanelAutomation } from "./StagePanelAutomation";
import { StagePanelAutomationForm } from "./StagePanelAutomationForm";

type PropsInner = {
	stageId: StagesId;
	userId: UsersId;
};

const StagePanelAutomationsInner = async (props: PropsInner) => {
	const [stage, automations] = await Promise.all([
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageAutomations(props.stageId).execute(),
	]);

	if (!stage) {
		return <SkeletonCard />;
	}

	return (
		<Card>
			<StagePanelCardHeader>
				<CardTitle>Automations</CardTitle>
				<StagePanelAutomationForm
					stageId={stage.id}
					communityId={stage.communityId as CommunitiesId}
					automations={automations}
				/>
			</StagePanelCardHeader>
			<CardContent>
				<ItemGroup className="gap-y-2">
					{automations.length > 0 ? (
						automations.map((automation) => (
							<StagePanelAutomation
								stageId={stage.id}
								communityId={stage.communityId as CommunitiesId}
								automation={automation}
								key={automation.id}
							/>
						))
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Bot size={16} />
								</EmptyMedia>
								<EmptyTitle>No automations</EmptyTitle>
								<EmptyDescription>
									Add an automation to get started
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</ItemGroup>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	userId: UsersId;
};

export const StagePanelAutomations = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelAutomationsInner
				stageId={props.stageId}
				userId={props.userId}
			/>
		</Suspense>
	);
};

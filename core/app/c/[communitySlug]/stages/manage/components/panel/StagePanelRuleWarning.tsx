import type { RulesId } from "~/kysely/types/public/Rules";
import type { StagesId } from "~/kysely/types/public/Stages";

export async function StagePanelRuleWarning({
	ruleId,
	stageId,
}: {
	ruleId: RulesId;
	stageId: StagesId;
}) {}

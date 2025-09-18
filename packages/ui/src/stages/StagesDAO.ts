import type { Stages } from "db/public";
import type { Brand } from "utils/types";
import { brand } from "utils/types";

export type StagesDAO = Brand<Stages, "StagesDAO">;
/**
 * Ensures that the stages object is only has the properties that are allowed to be passed to the client
 */
export const stagesDAO = (stages: Stages[]): StagesDAO[] => {
	const stagesDAO = stages.map((stage) =>
		brand<StagesDAO>({
			id: stage.id,
			createdAt: stage.createdAt,
			updatedAt: stage.updatedAt,
			name: stage.name,
			order: stage.order,
			communityId: stage.communityId,
		})
	);

	return stagesDAO;
};

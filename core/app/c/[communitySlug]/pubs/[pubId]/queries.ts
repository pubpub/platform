import type { User } from "@prisma/client";

import { cache } from "react";

import { expect } from "utils";

import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import { pubValuesInclude } from "~/lib/types";
import prisma from "~/prisma/db";

export const getStageActions = cache(async (stageId: string) => {
	return await db
		.selectFrom("action_instances")
		.selectAll()
		.where("stageId", "=", stageId as StagesId)
		.execute();
});

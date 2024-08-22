import type { NewRules, RulesId } from "db/public";

import { db } from "~/kysely/database";
import { autoRevalidate } from "./cache/autoRevalidate";

export const createRule = (props: NewRules) => autoRevalidate(db.insertInto("rules").values(props));

export const removeRule = (ruleId: RulesId) =>
	autoRevalidate(db.deleteFrom("rules").where("id", "=", ruleId));

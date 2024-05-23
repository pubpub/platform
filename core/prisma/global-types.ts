import { Interval } from "~/actions/_lib/rules";

import "../actions/types";

declare global {
	namespace PrismaJson {
		type RuleConfig = { duration: number; interval: Interval };
	}
}

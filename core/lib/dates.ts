import { addDays, addHours, addMinutes, addMonths, addWeeks, addYears } from "date-fns";

import type { PubInStageForDuration, RuleConfig } from "~/actions/_lib/rules";

export const addDuration = (duration: RuleConfig<PubInStageForDuration>, date = new Date()) => {
	const now = new Date(date);

	switch (duration.interval) {
		case "minute":
			return addMinutes(now, duration.duration);
		case "hour":
			return addHours(now, duration.duration);
		case "day":
			return addDays(now, duration.duration);
		case "week":
			return addWeeks(now, duration.duration);
		case "month":
			return addMonths(now, duration.duration);
		case "year":
			return addYears(now, duration.duration);
		case "hour":
			return addHours(now, duration.duration);
		default:
			throw new Error("Invalid interval");
	}
};

export const getMonthAndDateString = () => {
	const date = new Date();
	return date.toLocaleString("default", { month: "short", day: "numeric" });
};

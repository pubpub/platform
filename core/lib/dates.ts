import {
	addDays,
	addHours,
	addMinutes,
	addMonths,
	addSeconds,
	addWeeks,
	addYears,
	differenceInDays,
	format,
	formatDistanceToNow,
} from "date-fns";

import type { AutomationConfig, PubInStageForDuration } from "~/actions/_lib/triggers";

export const addDuration = (
	duration:
		| AutomationConfig<PubInStageForDuration>["automationConfig"]
		| { duration: number; interval: "second" },
	date = new Date()
) => {
	const now = new Date(date);

	switch (duration.interval) {
		// this is only used in tests/seeds
		case "second":
			return addSeconds(now, duration.duration);
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
		default:
			throw new Error("Invalid interval");
	}
};

/**
 * Format a date object as ex: "3:24 PM"
 */
export const formatDateAsTime = (date = new Date()) => {
	return format(date, "h:mm aa");
};

export const formatDateAsMonthDayYear = (date: Date) => {
	return date.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
};

/** Format a date as ex: "Apr 28, 2025" OR if it is less than a week away, as "4 days ago" */
export const formatDateAsPossiblyDistance = (date: Date) => {
	const now = new Date();
	const daysDiff = differenceInDays(now, date);
	if (daysDiff <= 7) {
		return formatDistanceToNow(date, { addSuffix: true });
	}
	return formatDateAsMonthDayYear(date);
};

// Used for createdAt in pub tables
export const dateFormatOptions = {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

import { Pickaxe, SquareSquare } from "lucide-react";

export type DataTableConfig = typeof dataTableConfig;

export const dataTableConfig = {
	featureFlags: [
		{
			label: "Advanced table",
			value: "advancedTable" as const,
			icon: Pickaxe,
			tooltipTitle: "Toggle advanced table",
			tooltipDescription: "A filter and sort builder to filter and sort rows.",
		},
		{
			label: "Floating bar",
			value: "floatingBar" as const,
			icon: SquareSquare,
			tooltipTitle: "Toggle floating bar",
			tooltipDescription: "A floating bar that sticks to the top of the table.",
		},
	],
	textOperators: [
		{ label: "Contains", value: "$contains" as const },
		{ label: "Does not contain", value: "$notContains" as const },
		{ label: "Is", value: "$eq" as const },
		{ label: "Is not", value: "$ne" as const },
		{ label: "Is empty", value: "$null" as const },
		{ label: "Is not empty", value: "$exists" as const },
	],
	numericOperators: [
		{ label: "Is", value: "$eq" as const },
		{ label: "Is not", value: "$ne" as const },
		{ label: "Is less than", value: "$lt" as const },
		{ label: "Is less than or equal to", value: "$lte" as const },
		{ label: "Is greater than", value: "$gt" as const },
		{ label: "Is greater than or equal to", value: "$gte" as const },
		{ label: "Is empty", value: "$null" as const },
		{ label: "Is not empty", value: "$exists" as const },
	],
	dateOperators: [
		{ label: "Is", value: "$eq" as const },
		{ label: "Is not", value: "$ne" as const },
		{ label: "Is before", value: "$lt" as const },
		{ label: "Is after", value: "$gt" as const },
		{ label: "Is on or before", value: "$lte" as const },
		{ label: "Is on or after", value: "$gte" as const },
		{ label: "Is between", value: "$between" as const },
		{ label: "Is relative to today", value: "$isRelativeToToday" as const },
		{ label: "Is empty", value: "$null" as const },
		{ label: "Is not empty", value: "$exists" as const },
	],
	selectOperators: [
		{ label: "Is", value: "$eq" as const },
		{ label: "Is not", value: "$ne" as const },
		{ label: "Is empty", value: "$null" as const },
		{ label: "Is not empty", value: "$exists" as const },
	],
	booleanOperators: [
		{ label: "Is", value: "$eq" as const },
		{ label: "Is not", value: "$ne" as const },
	],
	joinOperators: [
		{ label: "And", value: "$and" as const },
		{ label: "Or", value: "$or" as const },
	],
	sortOrders: [
		{ label: "Asc", value: "asc" as const },
		{ label: "Desc", value: "desc" as const },
	],
	columnTypes: ["text", "number", "date", "boolean", "select", "multi-select"] as const,
	globalOperators: [
		"$contains",
		"$notContains",
		"$eq",
		"$ne",
		"$null",
		"$exists",
		"$lt",
		"$lte",
		"$gt",
		"$gte",
		"$between",
		"$isRelativeToToday",
		"$and",
		"$or",
	] as const,
};

import { Calendar } from "lucide-react"

import { cn } from "utils"

import { formatDateAsMonthDayYear, formatDateAsPossiblyDistance } from "~/lib/dates"

export function DateTimeDisplay({
	date,
	className,
	type,
}: {
	date: Date
	className?: string
	type: "relative" | "absolute"
}) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Calendar size="16px" strokeWidth="1px" />
			<time dateTime={date.toISOString()} title={date.toLocaleString()}>
				{type === "absolute"
					? formatDateAsMonthDayYear(date)
					: formatDateAsPossiblyDistance(date)}
			</time>
		</div>
	)
}

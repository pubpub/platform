import { Alert, AlertDescription, AlertTitle } from "ui/alert"
import { AlertCircle } from "ui/icon"
import { cn } from "utils"

export type NoticeParams = {
	type: "error" | "notice"
	title: string
	body?: string
}

export const Notice = ({
	type,
	title,
	body,
	className,
}: {
	className?: string
} & NoticeParams) => (
	<Alert
		variant={type === "error" ? "destructive" : "default"}
		className={cn(
			"mt-4",
			!body && "flex flex-row items-center [&>svg]:static",
			type === "error" && "bg-red-50 dark:bg-card",
			className
		)}
	>
		<AlertCircle className="h-4 w-4" />
		<AlertTitle className={cn("font-semibold", !body && "mb-0")}>{title}</AlertTitle>
		{body && <AlertDescription>{body}</AlertDescription>}
	</Alert>
)

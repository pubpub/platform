import { Alert, AlertDescription, AlertTitle } from "ui/alert"
import { AlertCircle } from "ui/icon"

export const Notice = ({
	variant,
	title,
	description,
}: {
	variant: "default" | "destructive"
	title: string | React.ReactNode
	description?: string | React.ReactNode
}) => (
	<Alert variant={variant} className="mt-4">
		<AlertCircle className="h-4 w-4" />
		<AlertTitle>{title}</AlertTitle>
		{description && <AlertDescription>{description}</AlertDescription>}
	</Alert>
)

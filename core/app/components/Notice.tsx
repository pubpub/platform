import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { AlertCircle } from "ui/icon";
import { cn } from "utils";

export const Notice = ({
	variant,
	title,
	description,
	className,
}: {
	variant: "default" | "destructive";
	title: string | React.ReactNode;
	description?: string | React.ReactNode;
	className?: string;
}) => (
	<Alert
		variant={variant}
		className={cn(
			"mt-4",
			!description && "flex flex-row items-center [&>svg]:static",
			className
		)}
	>
		<AlertCircle className="h-4 w-4" />
		<AlertTitle className={cn("font-semibold", !description && "mb-0")}>{title}</AlertTitle>
		{description && <AlertDescription>{description}</AlertDescription>}
	</Alert>
);

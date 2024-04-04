import { useCallback } from "react";
import { useToast } from "ui/use-toast";
import { UIException } from "./UIException";

export function useDisplayUiException() {
	const { toast } = useToast();
	const report = useCallback(
		({ message, id }: UIException) => {
			toast({
				title: "Error",
				variant: "destructive",
				description: `${message}${id ? ` (${id})` : ""}`,
			});
		},
		[toast]
	);
	return report;
}

import { useCallback } from "react";
import { useToast } from "ui/use-toast";
import { ClientException } from "./ClientException";

export function useShowClientException() {
	const { toast } = useToast();
	const report = useCallback(
		({ message, id, title }: ClientException) => {
			toast({
				title: title ?? "Error",
				variant: "destructive",
				description: `${message ?? "An unexpected error occurred"}${
					id ? ` (Error ID: ${id})` : ""
				}`,
			});
		},
		[toast]
	);
	return report;
}

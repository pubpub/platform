"use client";

import { Button } from "ui/button";
import { useToast } from "ui/use-toast";

import type { ClientException } from "~/lib/serverActions";

type Props = {
	onDelete: () => Promise<
		| string
		| ClientException
		| {
				error: string;
				cause: any;
		  }
		| undefined
	>;
};

export const StagePanelOverviewManagement = (props: Props) => {
	const { toast } = useToast();

	const onDeleteClick = async () => {
		const formName = await props.onDelete();
		if (formName) {
			console.log(formName);
			toast({
				title: "Warning",
				description: `The stage was deleted succesfully, but it was referenced by a submit button in the "${formName}" form. You may wish to update that button.`,
			});
		}
	};
	return (
		<>
			<h4 className="mb-2 font-semibold">Stage Management</h4>
			<Button variant="secondary" onClick={onDeleteClick}>
				Delete this Stage
			</Button>
		</>
	);
};

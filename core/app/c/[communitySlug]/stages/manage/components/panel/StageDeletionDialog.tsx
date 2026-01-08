"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ui/alert-dialog"

type Props = {
	onDeleteClick: () => void
	children: React.ReactNode
}

export const StageDeletionDialog = (props: Props) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this Stage</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription className="prose" asChild>
					<div>
						<p>
							Are you sure you want to delete this stage? This action cannot be
							undone.
						</p>
						<ul>
							<li>All Pubs currently in this stage will be left without one. </li>
							<li>
								All automations currently in this stage will be removed. You will
								still be able to see the automation history in the automation tab.
							</li>
						</ul>
					</div>
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={props.onDeleteClick}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

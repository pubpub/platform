import { Pencil, Plus, Trash } from "ui/icon";

export const CRUDMap = {
	create: {
		title: "Create Pub",
		buttonText: "Create",
		icon: Plus,
		param: `create-pub-form`,
	},
	update: {
		title: "Update Pub",
		buttonText: "Update",
		icon: Pencil,
		param: `update-pub-form`,
	},
	remove: {
		title: "Remove Pub",
		buttonText: "Remove",
		icon: Trash,
		param: `remove-pub-form`,
	},
} as const;

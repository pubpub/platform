"use client";

import { useFormContext } from "react-hook-form";

import { FormAccessType } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Contact, Lock, Users } from "ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

const iconsAndCopy = {
	[FormAccessType.inviteOnly]: {
		Icon: Contact,
		description: "Accessible via URL with tracked submissions",
		name: "Invite Only",
		help: "Community members & invited contributors can submit",
	},
	[FormAccessType.private]: {
		Icon: Lock,
		description: "Only accessible via Pub editor",
		name: "Private",
		help: "Only community members can create and edit",
	},
	[FormAccessType.public]: {
		Icon: Users,
		description: "Accessible via URL with untracked submissions",
		name: "Public",
		help: "Anyone with the link can submit",
	},
};

export const SelectAccess = () => {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name="access"
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-sm uppercase text-gray-500">Access</FormLabel>
					<hr />
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select a type" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{Object.values(FormAccessType).map((t) => {
								const { Icon, description, name } = iconsAndCopy[t];
								return (
									<SelectItem key={t} value={t.toString()}>
										<div className="flex h-auto flex-1 flex-shrink-0 items-center gap-2">
											<Icon size={16} />
											<div className="flex flex-col items-start">
												<div className="font-medium">{name}</div>
												<div className="text-xs text-gray-500">
													{description}
												</div>
											</div>
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<FormDescription>
						{iconsAndCopy[field.value as FormAccessType].help}
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

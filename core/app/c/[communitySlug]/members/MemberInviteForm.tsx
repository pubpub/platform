"use client";

import {
	Button,
	Checkbox,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
} from "ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";

const memberInviteFormSchema = z.object({
	email: z.string().email(),
	admin: z.boolean(),
	firstName: z.string(),
	lastName: z.string(),
});

const SuggestButton = (props: { onClick: () => Promise<void> }) => {
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				event.preventDefault();
				startTransition(props.onClick);
			}}
			disabled={pending}
		>
			{pending ? <Icon.Loader2 className="h-4 w-4" /> : <Icon.Wand2 className="h-4 w-4" />}
		</Button>
	);
};

export const MemberInviteForm = () => {
	const form = useForm<z.infer<typeof memberInviteFormSchema>>({
		resolver: zodResolver(memberInviteFormSchema),
	});

	function onSubmit(data: z.infer<typeof memberInviteFormSchema>) {
		console.log(data);
	}
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="email"
					render={({ field }) => (
						<FormItem aria-label="Email">
							<FormLabel>Email</FormLabel>
							<div className="flex items-center">
								<Input type="email" {...field} />
								<SuggestButton
									onClick={async () => {
										await new Promise((resolve) => setTimeout(resolve, 1000));
									}}
								/>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="admin"
					render={({ field }) => (
						<FormItem aria-label="Admin" className="flex flex-col ">
							<FormLabel>Admin?</FormLabel>
							<Checkbox {...field} className="w-4 h-4" />
						</FormItem>
					)}
				/>
				<FormField
					name="firstName"
					render={({ field }) => (
						<FormItem aria-label="First Name">
							<FormLabel>First Name</FormLabel>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="lastName"
					render={({ field }) => (
						<FormItem aria-label="Last Name">
							<FormLabel>Last Name</FormLabel>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Invite</Button>
			</form>
		</Form>
	);
};

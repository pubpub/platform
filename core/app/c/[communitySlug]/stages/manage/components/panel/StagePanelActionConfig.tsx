import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { Action } from "~/actions/types";

export type Props = {
	action: Action;
};

export const StagePanelActionConfig = (props: Props) => {
	const form = useForm({
		resolver: zodResolver(props.action.config),
	});
	const entries = Object.entries(
		// @ts-expect-error
		props.action.config.shape
	);

	const onSubmit = () => {};

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					{entries.map(([key]) => {
						return (
							<FormField
								key={key}
								name={key}
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{key}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription />
										<FormMessage />
									</FormItem>
								)}
							/>
						);
					})}
				</form>
			</Form>
		</div>
	);
};

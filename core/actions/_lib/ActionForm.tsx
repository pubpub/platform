import type { PropsWithChildren } from "react";

import { useCallback, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "ui/button";
import { Field, FieldGroup } from "ui/field";
import { Form } from "ui/form";

import { useActionForm } from "./ActionFormProvider";

type ActionFormProps = PropsWithChildren<{
	onSubmit(values: Record<string, unknown>, form: ReturnType<typeof useForm>): Promise<void>;
	onCancel(): void;
}>;

export function ActionForm(props: ActionFormProps) {
	const { form } = useActionForm();
	const [isPending, startTransition] = useTransition();
	const onSubmit = useCallback(
		(data: Record<string, unknown>) => {
			startTransition(async () => {
				await props.onSubmit(data, form);
			});
		},
		[props.onSubmit, form]
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FieldGroup>
					{props.children}
					<Field orientation="horizontal">
						<Button type="submit">
							Run Action{" "}
							{isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
						</Button>
						<Button variant="outline" type="button" onClick={props.onCancel}>
							Cancel
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Form>
	);
}

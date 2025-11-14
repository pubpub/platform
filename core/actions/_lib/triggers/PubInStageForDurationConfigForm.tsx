import { Controller } from "react-hook-form";

import type { AutomationEvent } from "db/public";
import { Field, FieldGroup } from "ui/field";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { AddionalConfigForm, pubInStageForDuration } from "../triggers";

export const PubInStageForDurationConfigForm: AddionalConfigForm<typeof pubInStageForDuration> = (
	props
) => {
	return (
		<Controller
			name={`triggers.${props.index}.config`}
			control={props.form.control}
			render={(p) => (
				<FieldGroup orientation="horizontal">
					<Controller
						name={`triggers.${props.index}.config.duration`}
						control={props.form.control}
						render={(p) => (
							<Field orientation="horizontal">
								<Input
									type="number"
									value={p.field.value}
									onChange={p.field.onChange}
								/>
							</Field>
						)}
					/>

					<Controller
						name={`triggers.${props.index}.config.interval`}
						control={props.form.control}
						render={(p) => (
							<Field orientation="horizontal">
								<Select value={p.field.value} onValueChange={p.field.onChange}>
									<SelectTrigger>
										<SelectValue placeholder="Select an interval" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="minute">Minute</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
				</FieldGroup>
			)}
		/>
	);
};

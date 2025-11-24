import { Controller } from "react-hook-form"

import { Field, FieldGroup, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"

import { type AddionalConfigForm, intervals, type pubInStageForDuration } from "../triggers"

export const PubInStageForDurationConfigForm: AddionalConfigForm<typeof pubInStageForDuration> = (
	props
) => {
	return (
		<Controller
			name={`triggers.${props.index}.config`}
			control={props.form.control}
			render={(p) => (
				<FieldGroup className="flex-row gap-2">
					<Controller
						name={`triggers.${props.index}.config.duration`}
						control={props.form.control}
						render={(p) => (
							<Field orientation="vertical" className="shrink grow-0 gap-1">
								<FieldLabel className="text-gray-700 text-xs">Duration</FieldLabel>
								<Input
									type="number"
									className="bg-white"
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
							<Field orientation="vertical" className="shrink grow-0 gap-1">
								<FieldLabel className="text-gray-700 text-xs">Interval</FieldLabel>
								<Select value={p.field.value} onValueChange={p.field.onChange}>
									<SelectTrigger className="h-9">
										<SelectValue placeholder="Select an interval" />
									</SelectTrigger>
									<SelectContent>
										{intervals.map((interval) => (
											<SelectItem key={interval} value={interval}>
												{interval}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
				</FieldGroup>
			)}
		/>
	)
}

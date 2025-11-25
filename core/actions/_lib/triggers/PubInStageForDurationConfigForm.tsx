import type { AddionalConfigForm, pubInStageForDuration } from "../triggers"

import { Controller } from "react-hook-form"

import { Field, FieldError, FieldGroup, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"

import { intervals } from "../triggers"

export const PubInStageForDurationConfigForm: AddionalConfigForm<typeof pubInStageForDuration> = (
	props
) => {
	return (
		<Controller
			name={`triggers.${props.idx}.config`}
			control={props.form.control}
			render={({ fieldState }) => {
				return (
					<FieldGroup className="flex-row items-start gap-2">
						<Controller
							name={`triggers.${props.idx}.config.duration`}
							control={props.form.control}
							render={(p) => (
								<Field
									orientation="vertical"
									className="shrink grow-0 gap-1"
									data-invalid={p.fieldState.invalid}
								>
									<FieldLabel className="text-gray-700 text-xs">
										Duration
									</FieldLabel>
									<Input
										type="number"
										className="bg-white"
										value={p.field.value}
										onChange={(e) =>
											p.field.onChange(
												e.target.value ? Number(e.target.value) : undefined
											)
										}
									/>
									{p.fieldState.error && (
										<FieldError className="text-xs">
											{p.fieldState.error.message}
										</FieldError>
									)}
								</Field>
							)}
						/>

						<Controller
							name={`triggers.${props.idx}.config.interval`}
							control={props.form.control}
							render={(p) => (
								<Field
									orientation="vertical"
									className="shrink grow-0 gap-1"
									data-invalid={p.fieldState.invalid}
								>
									<FieldLabel className="text-gray-700 text-xs">
										Interval
									</FieldLabel>
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
									{p.fieldState.error && (
										<FieldError className="text-xs">
											{p.fieldState.error.message}
										</FieldError>
									)}
								</Field>
							)}
						/>
						{fieldState.error && (
							<FieldError className="text-xs">{fieldState.error.message}</FieldError>
						)}
					</FieldGroup>
				)
			}}
		/>
	)
}

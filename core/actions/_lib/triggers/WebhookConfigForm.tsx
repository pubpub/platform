import type { AutomationEvent } from "db/public"
import type { AdditionalConfigForm } from "../triggers"

import { Controller } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "ui/field"
import { Input } from "ui/input"

import { useCommunity } from "~/app/components/providers/CommunityProvider"

export const WebhookConfigForm: AdditionalConfigForm<AutomationEvent.webhook> = (props) => {
	const community = useCommunity()
	return (
		<Controller
			name={`triggers.${props.idx}.config`}
			control={props.form.control}
			render={() => {
				return (
					<FieldGroup className="flex-row items-start gap-2">
						<Controller
							name={`triggers.${props.idx}.config.path`}
							control={props.form.control}
							render={(p) => (
								<Field
									orientation="vertical"
									className="shrink grow-0 gap-1"
									data-invalid={p.fieldState.invalid}
									aria-required={true}
								>
									<FieldLabel className="text-gray-700 text-xs">
										Path<span className="text-destructive">*</span>
									</FieldLabel>
									<Input
										className="bg-white"
										required
										defaultValue={p.field.value}
										value={p.field.value}
										onChange={(e) => p.field.onChange(e.target.value)}
									/>
									<FieldDescription className="text-xs">
										React to events at{" "}
										<a
											className="break-words font-mono underline"
											href={`${window.location.origin}/api/v0/c/${community.slug}/site/webhook/${p.field.value}`}
										>{`${window.location.origin}/api/v0/c/${community.slug}/site/webhook/${p.field.value}`}</a>
									</FieldDescription>
									{p.fieldState.error && (
										<FieldError className="text-xs">
											{p.fieldState.error.message}
										</FieldError>
									)}
								</Field>
							)}
						/>
					</FieldGroup>
				)
			}}
		/>
	)
}

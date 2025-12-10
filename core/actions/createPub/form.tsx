"use client"

import type { FormElements, PubFieldElement } from "~/app/components/forms/types"

import { useEffect, useId, useState } from "react"
import { skipToken } from "@tanstack/react-query"
import { Braces } from "lucide-react"
import { Controller, useWatch } from "react-hook-form"

import { Button } from "ui/button"
import { ButtonGroup } from "ui/button-group"
import { Checkbox } from "ui/checkbox"
import { Confidence } from "ui/customRenderers/confidence/confidence"
import { FileUpload } from "ui/customRenderers/fileUpload/fileUpload"
import { DatePicker } from "ui/date-picker"
import { Field, FieldError, FieldLabel, FieldSet } from "ui/field"
import { Input } from "ui/input"
import { MultiValueInput } from "ui/multivalue-input"
import { RadioGroup, RadioGroupItem } from "ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { Skeleton } from "ui/skeleton"
import { StagesSelect } from "ui/stages"
import { Textarea } from "ui/textarea"
import { cn } from "utils"

import { upload } from "~/app/components/forms/actions"
import { FileUploadPreview } from "~/app/components/forms/FileUpload"
import { MemberSelectClientFetch } from "~/app/components/MemberSelect/MemberSelectClientFetch"
import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { client } from "~/lib/api"
import { useServerAction } from "~/lib/serverActions"
import { ActionField } from "../_lib/ActionField"
import { ActionFieldJsonataInput } from "../_lib/ActionFieldJsonataInput"
import { useActionForm } from "../_lib/ActionForm"
import { isJsonTemplate } from "../_lib/schemaWithJsonFields"

const getDefaultValueForComponent = (component: string | null): unknown => {
	switch (component) {
		case "textInput":
		case "textArea":
			return ""
		case "colorPicker":
			return "#000000"
		case "checkbox":
			return false
		case "checkboxGroup":
		case "multivalueInput":
			return []
		case "radioGroup":
		case "selectDropdown":
			return ""
		case "memberSelect":
		case "fileUpload":
		case "richText":
		case "relationBlock":
			return undefined
		case "confidenceInterval":
			return [0, 50, 100]
		default:
			return undefined
	}
}

const createDefaultValuesFromElements = (elements: FormElements[]): Record<string, unknown> => {
	const defaults: Record<string, unknown> = {}

	for (const element of elements) {
		if (element.type === "pubfield") {
			const defaultValue = getDefaultValueForComponent(element.component)
			if (defaultValue !== undefined) {
				defaults[element.id] = defaultValue
			}
		}
	}

	return defaults
}

const FileUploadInput = ({ field, elementId }: { field: any; elementId: string }) => {
	const runUpload = useServerAction(upload)

	const signedUploadUrl = async (fileName: string) => {
		// No pubId since we're creating a new pub
		return runUpload(fileName, undefined)
	}

	return (
		<div className="isolate space-y-2">
			<FileUpload
				upload={signedUploadUrl}
				onUpdateFiles={(files) => {
					const newFiles = [
						...(field.value ?? []),
						...files.filter(
							(f) =>
								!(field.value ?? []).some((f2: any) => f2.fileName === f.fileName)
						),
					]
					field.onChange(newFiles)
				}}
				id={elementId}
			/>
			{field.value && field.value.length > 0 && (
				<FileUploadPreview
					files={field.value}
					onDelete={(file) => {
						field.onChange(field.value.filter((f: any) => f.fileName !== file.fileName))
					}}
				/>
			)}
		</div>
	)
}

type CreatePubFormFieldProps = {
	element: PubFieldElement
	path?: string
	control: any
	renderInput: (field: any) => React.ReactNode
}

type InputState = {
	mode: "normal" | "jsonata"
	jsonValue: string
	normalValue: unknown
}

const CreatePubFormField = ({ element, path, control, renderInput }: CreatePubFormFieldProps) => {
	const fieldName = path ? `${path}.pubValues.${element.id}` : `pubValues.${element.id}`
	const labelId = useId()
	const val = useWatch({ control, name: fieldName })

	// Initialize state based on whether the current value is a JSONata template
	const [inputState, setInputState] = useState<InputState>(() => {
		const isJsonata = isJsonTemplate(val)
		return {
			mode: isJsonata ? "jsonata" : "normal",
			jsonValue: isJsonata ? (val as string) : "",
			normalValue: isJsonata ? "" : val,
		}
	})

	// Sync state when external value changes
	useEffect(() => {
		setInputState((prev) => ({
			...prev,
			jsonValue: prev.mode === "jsonata" ? val : prev.jsonValue,
			normalValue: prev.mode === "normal" ? val : prev.normalValue,
		}))
	}, [val])

	return (
		<Controller
			name={fieldName}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<div className="flex flex-row items-center justify-between space-x-2">
						<FieldLabel
							htmlFor={field.name}
							aria-required={!!element.required}
							id={labelId}
						>
							{element.label ?? element.fieldName}
							{element.required && <span className="-ml-1 text-red-500">*</span>}
						</FieldLabel>
						<ButtonGroup>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								aria-label={`Toggle JSONata mode for ${element.label ?? element.fieldName}`}
								data-testid={`toggle-jsonata-${field.name}`}
								className={cn(
									"font-mono font-semibold text-gray-900 hover:bg-amber-50",
									"transition-colors duration-200",
									inputState.mode === "jsonata" &&
										"border-orange-400 bg-orange-50 text-orange-900"
								)}
								onClick={() => {
									const newMode =
										inputState.mode === "jsonata" ? "normal" : "jsonata"
									field.onChange(
										newMode === "jsonata"
											? inputState.jsonValue
											: inputState.normalValue
									)
									setInputState((prev) => ({
										...prev,
										mode: newMode,
									}))
								}}
							>
								<Braces size={14} />
							</Button>
						</ButtonGroup>
					</div>
					{inputState.mode === "jsonata" ? (
						<ActionFieldJsonataInput
							aria-labelledby={labelId}
							field={field}
							isDefaultField={false}
							actionAccepts={["pub", "json"]}
						/>
					) : (
						renderInput(field)
					)}
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</Field>
			)}
		/>
	)
}

type CreatePubFormInnerProps = {
	elements: FormElements[]
}

const CreatePubFormInner = (props: CreatePubFormInnerProps) => {
	const { form: actionForm, path } = useActionForm()
	const elements = props.elements.filter((e): e is PubFieldElement => e.type === "pubfield")

	// Set default values for all pub field elements when elements change
	useEffect(() => {
		const fullPath = path ? `${path}.pubValues` : "pubValues"

		const defaultValues = createDefaultValuesFromElements(props.elements)
		const currentPubValues = actionForm.getValues(fullPath) || {}

		// Only set defaults for fields that don't already have a value
		for (const [elementId, defaultValue] of Object.entries(defaultValues)) {
			if (currentPubValues[elementId] === undefined) {
				actionForm.setValue(`${fullPath}.${elementId}`, defaultValue, {
					shouldValidate: false,
					shouldDirty: false,
				})
			}
		}
	}, [props.elements, actionForm])

	const components: React.ReactNode[] = []

	for (const element of elements) {
		switch (element.component) {
			case "textInput":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<Input
								{...field}
								placeholder={(element.config as any)?.placeholder || ""}
								className="bg-white"
							/>
						)}
					/>
				)
				break

			case "textArea":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<Textarea
								{...field}
								placeholder={(element.config as any)?.placeholder || ""}
								className="bg-white"
							/>
						)}
					/>
				)
				break

			case "checkbox":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<div className="flex flex-row items-center gap-2">
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									id={element.id}
								/>
							</div>
						)}
					/>
				)
				break

			case "datePicker":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<DatePicker date={field.value} setDate={field.onChange} />
						)}
					/>
				)
				break

			case "selectDropdown": {
				const selectConfig = element.config as {
					placeholder?: string
					options?: { value: string; label: string }[]
				} | null
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger id={element.id}>
									<SelectValue
										placeholder={
											selectConfig?.placeholder || "Select an option"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{selectConfig?.options?.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				)
				break
			}

			case "radioGroup": {
				const radioConfig = element.config as {
					options?: { value: string; label: string }[]
				} | null
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
								{radioConfig?.options?.map((option) => (
									<div key={option.value} className="flex items-center gap-2">
										<RadioGroupItem value={option.value} id={option.value} />
										<FieldLabel htmlFor={option.value}>
											{option.label}
										</FieldLabel>
									</div>
								))}
							</RadioGroup>
						)}
					/>
				)
				break
			}

			case "checkboxGroup": {
				const checkboxConfig = element.config as {
					options?: { value: string; label: string }[]
				} | null
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<div className="flex flex-col gap-2">
								{checkboxConfig?.options?.map((option) => (
									<div key={option.value} className="flex items-center gap-2">
										<Checkbox
											checked={field.value?.includes(option.value)}
											onCheckedChange={(checked) => {
												const current = field.value || []
												if (checked) {
													field.onChange([...current, option.value])
												} else {
													field.onChange(
														current.filter(
															(v: string) => v !== option.value
														)
													)
												}
											}}
											id={option.value}
										/>
										<FieldLabel htmlFor={option.value}>
											{option.label}
										</FieldLabel>
									</div>
								))}
							</div>
						)}
					/>
				)
				break
			}

			case "multivalueInput": {
				const multiConfig = element.config as { placeholder?: string } | null
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<MultiValueInput
								value={field.value || []}
								onChange={field.onChange}
								placeholder={multiConfig?.placeholder || "Add value..."}
							/>
						)}
					/>
				)
				break
			}

			case "colorPicker":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<div className="flex gap-2">
								<input
									type="color"
									{...field}
									value={field.value || "#000000"}
									className="h-10 w-20"
								/>
								<Input {...field} placeholder="#000000" />
							</div>
						)}
					/>
				)
				break

			case "memberSelect":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<MemberSelectClientFetch
								name={element.id}
								value={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
				)
				break

			case "confidenceInterval":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<div className="mb-6">
								<Confidence
									value={field.value ?? [0, 50, 100]}
									defaultValue={[0, 50, 100]}
									min={0}
									max={100}
									onValueChange={field.onChange}
									className="confidence mb-6"
								/>
							</div>
						)}
					/>
				)
				break

			case "fileUpload": {
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={(field) => (
							<FileUploadInput field={field} elementId={element.id} />
						)}
					/>
				)
				break
			}

			case "richText":
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={() => (
							<div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
								{element.component} component - implementation pending
							</div>
						)}
					/>
				)
				break

			default:
				// Handle unknown component types
				components.push(
					<CreatePubFormField
						key={element.id}
						element={element}
						control={actionForm.control}
						path={path}
						renderInput={() => (
							<div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
								Unknown component type: {element.component}
							</div>
						)}
					/>
				)
				break
		}
	}
	return <div className="flex flex-col gap-4">{components}</div>
}

type CreatePubFormProps = {}

export default function CreatePubForm(props: CreatePubFormProps) {
	const community = useCommunity()
	const { form, path } = useActionForm()

	const fullFormSlug = path ? `${path}.formSlug` : "formSlug"

	const { data: forms, isLoading: formsAreLoading } = client.forms.getForms.useQuery({
		queryKey: ["forms", community.slug],
		queryData: {
			params: {
				communitySlug: community.slug,
			},
		},
	})

	const selectedFormSlug = useWatch({ control: form.control, name: fullFormSlug })

	const { data: selectedForm, isLoading: selectedFormIsLoading } = client.forms.getForm.useQuery({
		queryData: selectedFormSlug
			? {
					params: {
						communitySlug: community.slug,
						formSlug: selectedFormSlug,
					},
				}
			: skipToken,
		initialData: undefined,
		queryKey: ["forms", "getForm", community.id, selectedFormSlug],
	})

	return (
		<FieldSet>
			<ActionField
				name="stage"
				label="Stage"
				render={({ field }) => <StagesSelect field={field} />}
			/>
			{formsAreLoading ? (
				<Skeleton className="flex flex-col gap-2">
					<Skeleton className="h-4" />
				</Skeleton>
			) : forms?.body ? (
				<ActionField
					name="formSlug"
					label="Form"
					render={({ field, fieldState }) => {
						return (
							<Select
								onValueChange={(value) => {
									field.onChange(value)
								}}
								value={field.value ?? ""}
							>
								<SelectTrigger
									id="form"
									aria-label="Select a form"
									aria-describedby="Form"
									aria-invalid={fieldState.invalid}
								>
									<SelectValue placeholder="Select a form" />
								</SelectTrigger>
								<SelectContent>
									{forms?.body.map((form) => (
										<SelectItem key={form.slug} value={form.slug}>
											{form.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)
					}}
				/>
			) : (
				<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-gray-300 border-dashed bg-gray-50 p-6 text-center">
					<p className="font-medium text-gray-900 text-sm">No forms available</p>
					<p className="text-gray-500 text-xs">
						This action requires at least one form to be configured in this community.
					</p>
				</div>
			)}
			{selectedFormIsLoading ? (
				<Skeleton className="mt-4 flex flex-col gap-2">
					<Skeleton className="h-4" />
					<Skeleton className="h-10" />
				</Skeleton>
			) : selectedForm ? (
				<CreatePubFormInner elements={selectedForm.body.elements as FormElements[]} />
			) : null}
		</FieldSet>
	)
}

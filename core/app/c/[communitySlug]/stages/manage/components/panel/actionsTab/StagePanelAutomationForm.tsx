"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
	AutomationsId,
	Communities,
	CommunitiesId,
	StagesId,
} from "db/public";
import {
	type Action,
	AutomationConditionBlockType,
	AutomationConditionType,
	AutomationEvent,
	automationsIdSchema,
	type ConditionEvaluationTiming,
	conditionEvaluationTimingSchema,
} from "db/public";
import { ChevronRight, type Icon, X } from "lucide-react";
import { parseAsString, useQueryState, type ParserBuilder } from "nuqs";
import { memo, useCallback, useEffect, useId, useMemo, useState } from "react";
import type {
	ControllerFieldState,
	ControllerRenderProps,
	FieldValues,
	UseFormReturn,
	UseFormStateReturn,
} from "react-hook-form";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import type { IconConfig } from "ui/dynamic-icon";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Plus } from "ui/icon";
import { Input } from "ui/input";
import { Item, ItemContent, ItemHeader } from "ui/item";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "ui/select";
import { FormSubmitButton } from "ui/submit-button";
import { cn } from "utils";
import { z, type ZodTypeDef } from "zod";
import { ActionConfigBuilder } from "~/actions/_lib/ActionConfigBuilder";
import { ActionFormContext } from "~/actions/_lib/ActionForm";
import {
	getTriggerByName,
	humanReadableEventBase,
	isTriggerWithConfig,
	triggers,
} from "~/actions/_lib/triggers";
import { getTriggerConfigForm } from "~/actions/_lib/triggers/forms";
import { actions } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { isSequentialAutomationEvent } from "~/actions/types";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { useUserOrThrow } from "~/app/components/providers/UserProvider";
import type { getAutomation, getStageAutomations } from "~/lib/db/queries";
import { entries } from "~/lib/mapping";
import { findRanksBetween } from "~/lib/rank";
import { isClientException, useServerAction } from "~/lib/serverActions";
import type { AutoReturnType } from "~/lib/types";
import { addOrUpdateAutomation } from "../../../actions";
import { ConditionBlock, type ConditionBlockFormValue } from "./ConditionBlock";
import { IconPicker } from "./IconPicker";
import { StagePanelActionCreator } from "./StagePanelActionCreator";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	automations: AutoReturnType<typeof getAutomation>["execute"];
};

const AutomationSelector = ({
	fieldProps,
	fieldState,
	label,
	placeholder,
	disabledAutomationId,
	dataTestIdPrefix,
	automations,
}: {
	fieldProps: ControllerRenderProps<
		CreateAutomationsSchema,
		`triggers.${number}.sourceAutomationId`
	>;
	fieldState: ControllerFieldState;
	label: string;
	placeholder: string;
	disabledAutomationId?: AutomationsId;
	dataTestIdPrefix?: string;
	automations: { id: AutomationsId; name: string }[];
}) => {
	return (
		<Field data-invalid={fieldState.invalid}>
			<FieldLabel>{label}</FieldLabel>
			<Select
				onValueChange={fieldProps.onChange}
				defaultValue={fieldProps.value}
				value={fieldProps.value}
			>
				<SelectTrigger data-testid={`${dataTestIdPrefix}-select-trigger`}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{automations.map((automation) => {
						const isDisabled = disabledAutomationId === automation.id;
						return (
							<SelectItem
								key={automation.id}
								value={automation.id}
								className="hover:bg-gray-100"
								disabled={isDisabled}
								data-testid={`${dataTestIdPrefix}-select-item-${automation.id}`}
							>
								<div className="flex flex-row items-center gap-x-2">
									<span>{automation.name}</span>
									{isDisabled && (
										<span className="text-gray-400 text-xs">
											(self-reference not allowed)
										</span>
									)}
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			{fieldState.error && (
				<FieldError className="text-xs">{fieldState.error.message}</FieldError>
			)}
		</Field>
	);
};

const conditionBlockSchema: z.ZodType<ConditionBlockFormValue> = z.lazy(() =>
	z.object({
		id: z.string().optional(),
		type: z.nativeEnum(AutomationConditionBlockType),
		kind: z.literal("block"),
		rank: z.string(),
		items: z
			.array(
				z.union([
					z.object({
						id: z.string().optional(),
						kind: z.literal("condition"),
						type: z.nativeEnum(AutomationConditionType),
						expression: z.string().min(1),
						rank: z.string(),
					}),
					conditionBlockSchema,
				]),
			)
			.min(1),
	}),
);

export type CreateAutomationsSchema = {
	name: string;
	description?: string;
	icon?: IconConfig;
	condition?: ConditionBlockFormValue;
	triggers: {
		_id: string;
		event: AutomationEvent;
		config?: Record<string, unknown>;
		sourceAutomationId?: AutomationsId | undefined;
	}[];
	action: {
		action: Action;
		config: Record<string, unknown>;
	};
	conditionEvaluationTiming: ConditionEvaluationTiming;
};

export const StagePanelAutomationForm = (props: Props) => {
	const [currentlyEditingAutomationId, setCurrentlyEditingAutomationId] =
		useQueryState("automation-id", parseAsString as unknown as ParserBuilder<AutomationsId  >);

	const [isOpen, setIsOpen] = useState(false);

	const open = isOpen || !!currentlyEditingAutomationId;

	const isExistingAutomation = !!currentlyEditingAutomationId;

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) {
				setCurrentlyEditingAutomationId(null);
			}
			setIsOpen(newOpen);
		},
		[setCurrentlyEditingAutomationId],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					data-testid="add-automation-button"
					className="m-0 h-6 p-0 text-neutral-700 hover:bg-transparent hover:text-neutral-900"
				>
					<Plus size={16} /> Add automation
				</Button>
			</DialogTrigger>
			<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto p-0">
				<DialogHeader className="sticky inset-0 top-0 z-10 bg-white p-6 pb-2">
					<DialogTitle>
						{isExistingAutomation ? "Edit automation" : "Add automation"}
					</DialogTitle>
					<DialogDescription>
						Set up an automation to run whenever a certain event is triggered.
					</DialogDescription>
				</DialogHeader>

				<div className="p-6 pt-0">
					{open && (
						<Form
							key={currentlyEditingAutomationId || "new"}
							{...{
								currentlyEditingAutomationId,
								setCurrentlyEditingAutomationId,
								...props,
							}}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

type ConfigCardProps = {
	icon: typeof ChevronRight;
	title: React.ReactNode;
	onRemove: () => void;
	children?: React.ReactNode;
	showCollapseToggle?: boolean;
	isError?: boolean;
	defaultCollapsed?: boolean;
};

const ConfigCard = memo(
	function ConfigCard(props: ConfigCardProps) {
		const [isCollapsed, setIsCollapsed] = useState(
			props.defaultCollapsed ?? false,
		);
		const hasContent = !!props.children;
		const Icon = props.icon;

		return (
			<Collapsible
				open={!isCollapsed}
				onOpenChange={(open) => setIsCollapsed(!open)}
				defaultOpen={!props.defaultCollapsed}
			>
				<Item variant="outline" className="bg-neutral-50" size="sm">
					{/* <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"> */}
					<ItemHeader className={cn(props.isError && "text-destructive")}>
						{props.showCollapseToggle && hasContent ? (
							<CollapsibleTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 w-full p-0 justify-start items-center hover:bg-transparent"
								>
									<span className="sr-only">
										{isCollapsed ? "Expand" : "Collapse"}
									</span>
									<ChevronRight
										size={14}
										className={cn(
											"transition-transform duration-200 ease-out",
											!isCollapsed && "rotate-90",
										)}
									/>

									<Icon
										className={cn(
											"h-4 w-4 flex-shrink-0 text-neutral-600",
											props.isError && "text-destructive",
										)}
									/>
									<span
										className={cn(
											"flex-1 font-medium text-neutral-900 text-sm text-left",
											props.isError && "text-destructive",
										)}
									>
										{props.title}
									</span>
								</Button>
							</CollapsibleTrigger>
						) : (
							<>
								<Icon
									className={cn(
										"h-4 w-4 flex-shrink-0 text-neutral-600",
										props.isError && "text-destructive",
									)}
								/>
								<span
									className={cn(
										"flex-1 font-medium text-neutral-900 text-sm",
										props.isError && "text-destructive",
									)}
								>
									{props.title}
								</span>
							</>
						)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={props.onRemove}
						>
							<span className="sr-only">Remove</span>
							<X size={14} />
						</Button>
					</ItemHeader>

					<CollapsibleContent className={cn(!hasContent ? "hidden" : "w-full")}>
						{hasContent && (
							<ItemContent className=" overflow-visible m-1">
								{props.children}
							</ItemContent>
						)}
					</CollapsibleContent>
				</Item>
			</Collapsible>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.icon === nextProps.icon &&
			prevProps.title === nextProps.title &&
			prevProps.isError === nextProps.isError &&
			prevProps.showCollapseToggle === nextProps.showCollapseToggle &&
			prevProps.defaultCollapsed === nextProps.defaultCollapsed &&
			prevProps.children === nextProps.children
		);
	},
);
function Form(
	props: Props & {
		currentlyEditingAutomationId: AutomationsId |  null;
		setCurrentlyEditingAutomationId: (
			id: AutomationsId |  null,
		) => void;
	},
) {
	const { currentlyEditingAutomationId, setCurrentlyEditingAutomationId } =
		props;

	const schema = useMemo(
		() =>
			z
				.object({
					name: z.string().min(1, "Name is required"),
					description: z.string().nullish(),
					icon: z
						.object({
							name: z.string(),
							variant: z.enum(["solid", "outline"]).nullish(),
							color: z.string().nullish(),
						})
						.nullish(),
					conditionEvaluationTiming: conditionEvaluationTimingSchema.nullish(),
					condition: conditionBlockSchema.nullish(),
					triggers: z
						.array(
							z.discriminatedUnion(
								"event",
								entries(triggers).map(([event, automation]) =>
									z.object({
										_id: z.string().default(() => crypto.randomUUID()),
										event: z.literal(event),
										...(automation.config ? { config: automation.config } : {}),
										...(isSequentialAutomationEvent(event)
											? { sourceAutomationId: automationsIdSchema }
											: {}),
									}),
								) as unknown as [z.ZodObject<{_id:z.ZodString,event:z.ZodLiteral<AutomationEvent>,config:z.ZodObject<any>,sourceAutomationId:z.ZodOptional<z.ZodType<AutomationsId, ZodTypeDef, AutomationsId>>}>,...z.ZodObject<{_id:z.ZodString,event:z.ZodLiteral<AutomationEvent>,config:z.ZodObject<any>,sourceAutomationId:z.ZodOptional<z.ZodType<AutomationsId, ZodTypeDef, AutomationsId>>}>[]],
							),
						)
						.min(1, "At least one trigger is required"),

					action: z.discriminatedUnion(
						"action",
						entries(actions).map(([actionName, action]) =>
							z.object({
								action: z.literal(actionName),
								config: new ActionConfigBuilder(actionName)
									.withConfig(action.config.schema)
									.withDefaults({})
									.getSchema(),
							}),
						) as [z.ZodObject<{action:z.ZodLiteral<Action>,config: z.ZodObject<any>}>,...z.ZodObject<{action:z.ZodLiteral<Action>,config: z.ZodObject<any>}>[]],
						{
							message: "Action is required",
							errorMap: (issue, ctx) => {
								if (issue.code === z.ZodIssueCode.invalid_union_discriminator || !issue.message) {
									return { message: "Action is required" };
								}

								return {message: issue.message}
							},
						},
					),
				})
				.superRefine((data, ctx) => {
					if (!data.triggers?.length) {
						return;
					}

					for (const [idx, trigger] of data.triggers.entries()) {
						if (!isSequentialAutomationEvent(trigger.event)) {
							continue;
						}
						if (!trigger.sourceAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message:
									"Source automation is required for automation chaining events",
							});
							continue;
						}

						if (trigger.sourceAutomationId === currentlyEditingAutomationId) {
							ctx.addIssue({
								path: ["triggers", idx, "sourceAutomationId"],
								code: z.ZodIssueCode.custom,
								message: "Automations may not trigger themselves in a loop",
							});
						}
					}
				}),
		[currentlyEditingAutomationId],
	);

	const runUpsertAutomation = useServerAction(addOrUpdateAutomation);

	const currentAutomation = props.automations.find(
		(automation) => automation.id === currentlyEditingAutomationId,
	);

	const defaultValues = useMemo(() => {
		if (!currentAutomation) {
			return {
				name: "",
				description: "",
				icon: undefined,
				action: {
					action: undefined,
					config: {},
				},
				triggers: [],
				condition: undefined,
				conditionEvaluationTiming: undefined,
			};
		}

		const actionInstance = currentAutomation.actionInstances[0];

		return {
			name: currentAutomation.name,
			description: currentAutomation.description ?? "",
			icon: currentAutomation.icon as IconConfig | undefined,
			action: {
				action: actionInstance?.action,
				config: actionInstance?.config ?? {},
			},
			triggers: currentAutomation.triggers.map((trigger) => ({
				_id: trigger.id,
				event: trigger.event,
				config: trigger.config,
				sourceAutomationId: trigger.sourceAutomationId,
			})),
			conditionEvaluationTiming: currentAutomation.conditionEvaluationTiming,
			condition: currentAutomation.condition,
		} as CreateAutomationsSchema;
	}, [currentAutomation]);

	const form = useForm<CreateAutomationsSchema>({
		resolver: zodResolver(schema),
		defaultValues,
	});

	const { setError } = form;

	const { user } = useUserOrThrow();

	const community = useCommunity();

	const onSubmit = useCallback(
		async (data: CreateAutomationsSchema) => {
			const result = await runUpsertAutomation({
				stageId: props.stageId,
				data,
				automationId: currentlyEditingAutomationId as AutomationsId | undefined,
			});
			if (!isClientException(result)) {
				setCurrentlyEditingAutomationId(null);
				return;
			}

			setError("root", { message: result.error });
		},
		[
			currentlyEditingAutomationId,
			props.stageId,
			runUpsertAutomation,
			setCurrentlyEditingAutomationId,
			setError,
		],
	);

	const formId = useId();

	const selectedAction = useWatch({ control: form.control, name: "action" });

	// track if we've already loaded the initial action to avoid clearing config on mount
	const [initialActionLoaded, setInitialActionLoaded] = useState(false);

	useEffect(() => {
		if (selectedAction?.action) {
			if (!initialActionLoaded) {
				setInitialActionLoaded(true);
				return;
			}
			form.setValue("action.config", {});
		}
	}, [selectedAction?.action, form, initialActionLoaded]);

	const condition = form.watch("condition");
	const _iconConfig = form.watch("icon");

	const {
		fields: selectedTriggers,
		append: appendTrigger,
		// this doesnt seem to work properly, see https://github.com/react-hook-form/react-hook-form/issues/12791
		remove: _removeTrigger,
	} = useFieldArray<CreateAutomationsSchema, "triggers">({
		control: form.control,
		name: "triggers",
	});

	const errors = form.formState.errors;

	return (
		<form
			id={formId}
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex flex-col gap-y-6"
		>
			<div className="flex flex-col gap-y-2">
				<div className="flex items-start gap-x-2">
					<Controller
						control={form.control}
						name="icon"
						render={({ field, fieldState }) => {
							return (
								<Field className="w-9" data-invalid={fieldState.invalid}>
									<FieldLabel>
										<span className="sr-only">Icon</span>
										{/* okay this is evil but i just don't want to show the label it looks bad */}
										<span className="w-full pt-[18px]"></span>
									</FieldLabel>
									<IconPicker value={field.value} onChange={field.onChange} />
								</Field>
							);
						}}
					/>
					<Controller
						control={form.control}
						name="name"
						render={({ field, fieldState }) => {
							return (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Name</FieldLabel>
									<Input placeholder="Automation name" {...field} />
								</Field>
							);
						}}
					/>
				</div>
				{errors.icon && (
					<FieldError className="text-xs">
						Icon Error: {errors.icon.message}
					</FieldError>
				)}
				{errors.name && (
					<FieldError className="text-xs">
						Name Error: {errors.name.message}
					</FieldError>
				)}
			</div>

			<Controller
				control={form.control}
				name="triggers"
				render={(controlProps) => (
					<TriggerField
					{...controlProps}
						automations={props.automations}
						currentlyEditingAutomationId={currentlyEditingAutomationId}
						form={form}
						appendTrigger={appendTrigger}
					/>
				)}
			/>

			{selectedTriggers.length > 0 && (
				<Controller
					control={form.control}
					name="condition"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<div className="flex items-center justify-between">
								<FieldLabel>Conditions (optional)</FieldLabel>
								{!condition ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={() => {
											const ranks = findRanksBetween({
												numberOfRanks: 1,
											});
											field.onChange({
												type: AutomationConditionBlockType.OR,
												kind: "block",
												rank: ranks[0],
												items: [],
											});
										}}
									>
										<Plus size={14} />
										Add conditions
									</Button>
								) : (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 text-neutral-500 text-xs"
										onClick={() => {
											field.onChange(undefined);
										}}
									>
										Remove all conditions
									</Button>
								)}
							</div>
							{condition && (
								<>
									<FieldDescription>
										Define conditions that must be met for this automation to
										run. Use JSONata expressions to construct a boolean value
										like <code>'Hello' in $.pub.values.title</code>.
									</FieldDescription>
									<ConditionBlock slug={"condition"} id={"root-block"} />
								</>
							)}
							{fieldState.error && (
								<FieldError className="text-xs">
									{fieldState.error.message}
								</FieldError>
							)}
						</Field>
					)}
				/>
			)}

			{selectedTriggers.length > 0 && (
				<Controller
					control={form.control}
					name="action"
					render={({ field, fieldState }) => {
						return (
							<Field>
								<FieldLabel>Run</FieldLabel>
								<div className="space-y-2">
									{field.value?.action ? (
										<ActionConfigCardWrapper
											action={field.value.action}
											form={form}
											onChange={field.onChange}
											isEditing={!!currentlyEditingAutomationId}
										/>
									) : null}
									{!field.value?.action && (
										<StagePanelActionCreator
											onAdd={(actionName) => {
												form.setValue("action", {
													action: actionName,
													config: {},
												});
											}}
											isSuperAdmin={user?.isSuperAdmin}
										>
											<Button
												data-testid="action-selector-select-trigger"
												variant="ghost"
												className="h-auto border justify-start border-dashed bg-transparent w-full"
											>
												<div className="flex items-center gap-2 py-1">
													<Plus size={16} className="text-neutral-500" />
													<span className="text-neutral-600">Add action</span>
												</div>
											</Button>
										</StagePanelActionCreator>
									)}
								</div>
								{fieldState.error && (
									<FieldError className="text-xs">
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						);
					}}
				/>
			)}

			{form.formState.errors.root && (
				<FieldError className="text-xs">
					{form.formState.errors.root?.message}
				</FieldError>
			)}

			<FormSubmitButton
				form={formId}
				formState={form.formState}
				idleText="Save automation"
				pendingText="Saving automation..."
				successText="Automation saved"
				errorText="Error saving automation"
			/>
		</form>
	);
}

const TriggerConfigCard = memo(
	function TriggerConfigCard(props: {
		trigger: CreateAutomationsSchema["triggers"][number];
		form: UseFormReturn<CreateAutomationsSchema>;
		idx: number;
		community: Communities;
		removeTrigger: () => void;
		currentlyEditingAutomationId: AutomationsId | undefined;
		stageAutomations: { id: AutomationsId; name: string }[];
		isEditing: boolean;
	}) {
		const trigger = getTriggerByName(props.trigger.event);

		const TriggerForm = useMemo(() => {
			if (!isTriggerWithConfig(props.trigger.event)) {
				return null;
			}

			return getTriggerConfigForm(props.trigger.event);
		}, [props.trigger.event]);

		if (!trigger) {
			return null;
		}

		const hasConfig = Boolean(
			isSequentialAutomationEvent(props.trigger.event) ||
				(trigger?.config && TriggerForm),
		);

		if (!hasConfig) {
			return (
				<ConfigCard
					icon={trigger.display.icon}
					title={humanReadableEventBase(props.trigger.event, props.community)}
					onRemove={props.removeTrigger}
					showCollapseToggle={false}
					defaultCollapsed={true}
				/>
			);
		}

		return (
			<ConfigCard
				icon={trigger.display.icon}
				title={humanReadableEventBase(props.trigger.event, props.community)}
				onRemove={props.removeTrigger}
				showCollapseToggle={hasConfig}
				defaultCollapsed={props.isEditing || !hasConfig}
			>
				{isSequentialAutomationEvent(props.trigger.event) && (
					<Controller
						control={props.form.control}
						name={`triggers.${props.idx}.sourceAutomationId`}
						render={({ field, fieldState }) => (
							<AutomationSelector
								fieldProps={field}
								fieldState={fieldState}
								label="After"
								placeholder="Select automation to watch"
								disabledAutomationId={props.currentlyEditingAutomationId}
								dataTestIdPrefix="watched-automation"
								automations={props.stageAutomations}
							/>
						)}
					/>
				)}
				{trigger.config && TriggerForm && (
					<TriggerForm form={props.form} idx={props.idx} />
				)}
			</ConfigCard>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.trigger.event === nextProps.trigger.event &&
			prevProps.trigger._id === nextProps.trigger._id &&
			prevProps.idx === nextProps.idx &&
			prevProps.isEditing === nextProps.isEditing &&
			prevProps.currentlyEditingAutomationId ===
				nextProps.currentlyEditingAutomationId
		);
	},
);

function ActionConfigCardWrapper(props: {
	action: Action;
	form: UseFormReturn<CreateAutomationsSchema>;
	onChange: (value: {
		action: Action | undefined;
		config: Record<string, unknown>;
	}) => void;
	isEditing: boolean;
}) {
	const removeAction = useCallback(() => {
		props.onChange({
			action: undefined,
			config: {},
		});
	}, [props.onChange]);

	return (
		<ActionConfigCard
			action={props.action}
			form={props.form}
			removeAction={removeAction}
			isEditing={props.isEditing}
		/>
	);
}

const ActionConfigCard = memo(
	function ActionConfigCard(props: {
		action: Action;
		form: UseFormReturn<CreateAutomationsSchema>;
		removeAction: () => void;
		isEditing: boolean;
	}) {
		const actionDef = actions[props.action];
		const ActionFormComponent = useMemo(() => {
			return getActionFormComponent(props.action);
		}, [props.action]);

		if (!ActionFormComponent) {
			return null;
		}

		return (
			<Controller
				control={props.form.control}
				name="action.config"
				render={({ fieldState }) => {
					return (
						<ConfigCard
							isError={fieldState.invalid}
							icon={actionDef.icon as typeof ChevronRight}
							title={actionDef.name}
							onRemove={props.removeAction}
							showCollapseToggle={true}
							defaultCollapsed={props.isEditing}
						>
							<ActionFormContext.Provider
								value={{
									action: actionDef,
									schema: actionDef.config.schema,
									path: "action.config",
									form: props.form as UseFormReturn<any> as UseFormReturn<FieldValues>,
									defaultFields: [],
									context: {
										type: "automation",
									},
								}}
							>
								<ActionFormComponent />
							</ActionFormContext.Provider>
							{fieldState.error && (
								<FieldError className="text-xs">
									{fieldState.error.message}
								</FieldError>
							)}
						</ConfigCard>
					);
				}}
			/>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.action === nextProps.action &&
			prevProps.isEditing === nextProps.isEditing
		);
	},
);

export const TriggerField = (props: {
	field: ControllerRenderProps<CreateAutomationsSchema, "triggers">;
	fieldState: ControllerFieldState;
	automations: { id: AutomationsId; name: string }[];
	currentlyEditingAutomationId: AutomationsId |  null;
	form: UseFormReturn<CreateAutomationsSchema>;
	appendTrigger: (trigger: CreateAutomationsSchema["triggers"][number]) => void;
}) => {
	const community = useCommunity();

	const selectTriggers = useMemo(() => {
		return Object.values(AutomationEvent)
			.filter(
				(event) => !props.field.value?.some((t) => t.event === event),
			)
			.map((event) => {
				const automation = getTriggerByName(event);

				return (
					<SelectItem
						key={event}
						value={event}
						className="hover:bg-gray-100"
						data-testid={`trigger-select-item-${event}`}
					>
						<automation.display.icon className="mr-2 inline h-4 w-4 text-xs" />
						{humanReadableEventBase(event, community)}
					</SelectItem>
				);
			});
	}, [props.field.value, community]);

	return (
		<Field data-invalid={props.fieldState.invalid}>
			<FieldLabel>When</FieldLabel>
			<div className="space-y-2">
				{props.field.value && props.field.value.length > 0
					? props.field.value.map((field, idx) => {
							return (
								<Controller
									control={props.form.control}
									name={`triggers.${idx}`}
									key={field._id}
									render={({ field }) => (
										<TriggerConfigCard
											currentlyEditingAutomationId={
												props.currentlyEditingAutomationId ?? undefined
											}
											stageAutomations={props.automations}
											trigger={field.value}
											form={props.form}
											idx={idx}
											community={community}
											removeTrigger={() => {
												props.field.onChange(
													props.field.value.filter(
														(t) => t._id !== field.value._id,
													),
												);
											}}
											isEditing={!!props.currentlyEditingAutomationId}
										/>
									)}
								/>
							);
						})
					: null}
				<Select
					onValueChange={(value) => {
						props.appendTrigger({
							_id: crypto.randomUUID(),
							event: value as AutomationEvent,
							config: {},
							sourceAutomationId: undefined,
						});
					}}
				>
					<SelectTrigger
						data-testid={`event-select-trigger`}
						className="h-12 w-full justify-start border-dashed"
					>
						<div className="flex items-center gap-2 py-1">
							<Plus size={16} className="text-neutral-500" />
							<span className="text-neutral-600">Add trigger</span>
						</div>
					</SelectTrigger>
					<SelectContent>{selectTriggers}</SelectContent>
				</Select>
			</div>
			{props.fieldState.error && (
				<FieldError className="text-xs">
					{props.fieldState.error.message}
				</FieldError>
			)}
		</Field>
	);
};

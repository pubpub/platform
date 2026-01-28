"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import type { Control, ControllerFieldState, FieldErrors } from "react-hook-form"
import type { CreateAutomationsSchema } from "./StagePanelAutomationForm"

import { memo, useCallback, useId, useState } from "react"
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Controller, useFieldArray, useWatch } from "react-hook-form"

import { AutomationConditionBlockType, AutomationConditionType } from "db/public"
import { Button } from "ui/button"
import { Code2, GripVertical, Layers, Plus, X } from "ui/icon"
import { Input } from "ui/input"
import { Item, ItemContent, ItemHeader } from "ui/item"
import { Label } from "ui/label"
import { usePubFieldContext } from "ui/pubFields"
import { usePubTypeContext } from "ui/pubTypes"
import {
	type FieldType,
	type Operator,
	OperatorSelector,
	PathSelector,
	ValueSelector,
} from "ui/queryBuilder"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { cn } from "utils"

import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu"
import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank"
import { useStages } from "../../../StagesContext"

export type ConditionBlockFormValue = {
	id?: string
	kind: "block"
	type: AutomationConditionBlockType
	rank: string
	items: ConditionItemFormValue[]
}

export type ConditionFormValue = {
	id?: string
	kind: "condition"
	type: AutomationConditionType
	expression: string
	rank: string
}

export type ConditionItemFormValue = ConditionFormValue | ConditionBlockFormValue

// parse expression string into path, operator, value
function parseExpression(expression: string): {
	path: string
	operator: Operator
	value: string
} | null {
	if (!expression.trim()) return null

	// handle $exists(path)
	const existsMatch = expression.match(/^\$exists\(([^)]+)\)$/)
	if (existsMatch) {
		return { path: existsMatch[1].trim(), operator: "exists", value: "" }
	}

	// handle string functions
	const funcMatch = expression.match(/^\$(contains|startsWith|endsWith)\(([^,]+),\s*(.+)\)$/)
	if (funcMatch) {
		const [, func, path, rawValue] = funcMatch
		let value = rawValue.trim()
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		return { path: path.trim(), operator: func as Operator, value }
	}

	// handle comparison operators
	const compMatch = expression.match(/^([^\s=!<>]+)\s*(=|!=|<=|>=|<|>|in)\s*(.+)$/)
	if (compMatch) {
		const [, path, op, rawValue] = compMatch
		let value = rawValue.trim()
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		return { path: path.trim(), operator: op as Operator, value }
	}

	return null
}

// convert path, operator, value to expression string
function toExpression(path: string, operator: Operator, value: string): string {
	if (!path) return ""

	if (operator === "exists") {
		return `$exists(${path})`
	}

	if (operator === "contains" || operator === "startsWith" || operator === "endsWith") {
		return `$${operator}(${path}, ${JSON.stringify(value)})`
	}

	const escapedValue = isNaN(Number(value)) ? JSON.stringify(value) : value
	return `${path} ${operator} ${escapedValue}`
}

type ConditionItemProps = {
	id: string
	expression: string
	onRemove: () => void
	onChange: (value: string) => void
	fieldState: ControllerFieldState
}

const ConditionItem = memo(
	({ id, expression, onRemove, onChange, fieldState }: ConditionItemProps) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
			useSortable({ id })
		const { invalid, error } = fieldState
		const pubFields = usePubFieldContext()
		const pubTypes = usePubTypeContext()
		const { stages } = useStages()

		// parse the expression to get initial values
		const parsed = parseExpression(expression)
		const [isCodeMode, setIsCodeMode] = useState(!parsed && !!expression)
		const [path, setPath] = useState(parsed?.path ?? "")
		const [operator, setOperator] = useState<Operator>(parsed?.operator ?? "=")
		const [value, setValue] = useState(parsed?.value ?? "")
		const [fieldType, setFieldType] = useState<FieldType>("unknown")
		const [codeValue, setCodeValue] = useState(expression)

		const style = {
			transform: CSS.Translate.toString(transform),
			transition,
		}

		const handlePathChange = useCallback(
			(newPath: string, type: FieldType) => {
				setPath(newPath)
				setFieldType(type)
				onChange(toExpression(newPath, operator, value))
			},
			[operator, value, onChange]
		)

		const handleOperatorChange = useCallback(
			(newOperator: Operator) => {
				setOperator(newOperator)
				onChange(toExpression(path, newOperator, value))
			},
			[path, value, onChange]
		)

		const handleValueChange = useCallback(
			(newValue: string) => {
				setValue(newValue)
				onChange(toExpression(path, operator, newValue))
			},
			[path, operator, onChange]
		)

		const handleCodeChange = useCallback(
			(newValue: string) => {
				setCodeValue(newValue)
				onChange(newValue)
			},
			[onChange]
		)

		const toggleMode = useCallback(() => {
			if (isCodeMode) {
				// try to parse code into visual
				const p = parseExpression(codeValue)
				if (p) {
					setPath(p.path)
					setOperator(p.operator)
					setValue(p.value)
				}
			} else {
				// sync visual to code
				setCodeValue(toExpression(path, operator, value))
			}
			setIsCodeMode(!isCodeMode)
		}, [isCodeMode, codeValue, operator, path, value])

		const showValueInput = operator !== "exists"

		return (
			<Item
				variant="outline"
				ref={setNodeRef}
				style={style}
				className={cn(
					"relative border-l-4 border-l-blue-100! bg-card px-1 py-2",
					isDragging && "z-10 cursor-grabbing",
					invalid && "border-red-300"
				)}
			>
				<ItemContent className="flex flex-row items-center gap-0.5">
					<Button
						type="button"
						aria-label="Drag handle"
						size="icon-sm"
						variant="ghost"
						className={cn("cursor-grab p-1", isDragging && "cursor-grabbing")}
						{...listeners}
						{...attributes}
					>
						<GripVertical size={14} className="text-muted-foreground" />
					</Button>
					<div className="flex grow flex-col gap-2">
						<div className="flex w-full items-center gap-2">
							{isCodeMode ? (
								<Input
									value={codeValue}
									onChange={(e) => handleCodeChange(e.target.value)}
									placeholder="$.pub.pubType.name = 'Article'"
									className="h-8 grow font-mono text-xs"
								/>
							) : (
								<>
									<PathSelector
										value={path}
										onChange={handlePathChange}
										pubFields={pubFields}
										pubTypes={pubTypes}
										stages={stages}
									/>
									<OperatorSelector
										value={operator}
										onChange={handleOperatorChange}
										fieldType={fieldType}
									/>
									{showValueInput && (
										<ValueSelector
											value={value}
											onChange={handleValueChange}
											path={path}
											operator={operator}
											fieldType={fieldType}
											pubTypes={pubTypes}
											stages={stages}
										/>
									)}
								</>
							)}
						</div>
						{invalid && error && (
							<p className="text-destructive text-xs">
								{error.type === "too_small"
									? "Condition cannot be empty"
									: error.message}
							</p>
						)}
					</div>

					<EllipsisMenu orientation="vertical">
						<EllipsisMenuButton
							onClick={toggleMode}
							className="h-8 px-2"
							title={isCodeMode ? "Switch to visual" : "Switch to code"}
							icon={isCodeMode ? Layers : Code2}
						>
							{isCodeMode ? "Visual" : "Code"}
						</EllipsisMenuButton>
						<EllipsisMenuButton
							className="p-1 text-muted-foreground-400"
							aria-label="Delete condition"
							onClick={onRemove}
							icon={X}
						>
							Remove
						</EllipsisMenuButton>
					</EllipsisMenu>
				</ItemContent>
			</Item>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.id === nextProps.id &&
			prevProps.expression === nextProps.expression &&
			prevProps.fieldState.invalid === nextProps.fieldState.invalid &&
			prevProps.fieldState.error?.message === nextProps.fieldState.error?.message
		)
	}
)

type ConditionBlockProps = {
	id: string
	slug: string
	depth?: number
	onRemove?: () => void
	fieldState: ControllerFieldState
	control: Control<CreateAutomationsSchema, any>
}

export const ConditionBlock = memo(
	({ slug, depth = 0, onRemove, id, fieldState, control: controlProp }: ConditionBlockProps) => {
		// this just makes the types easier
		const control = controlProp as unknown as Control<
			Record<string, ConditionItemFormValue>,
			any
		>
		const blockType = useWatch({ control, name: `${slug}.type` })

		const { invalid, error } = fieldState
		// we don't want to higlight the block if some subitems have errors, too much info
		const rootItemError =
			invalid && error && "items" in error && !Array.isArray(error.items)
				? (error.items as FieldErrors)?.root
				: null

		const { fields, append, move, update, remove } = useFieldArray({
			control,
			name: `${slug}.items`,
		})

		const sensors = useSensors(
			useSensor(PointerSensor),
			useSensor(KeyboardSensor, {
				coordinateGetter: sortableKeyboardCoordinates,
			})
		)

		const itemId = useId()

		const handleDragEnd = useCallback(
			(event: DragEndEvent) => {
				const changes = getRankAndIndexChanges(event, fields)
				if (changes) {
					move(changes.activeIndex, changes.overIndex)
					const { id: _id, ...movedField } = fields[changes.activeIndex]
					update(changes.overIndex, {
						...movedField,
						rank: changes.rank,
					})
				}
			},
			[move, update, fields]
		)

		const handleAdd = useCallback(
			(kind: "condition" | "block") => {
				const ranks = findRanksBetween({
					start: fields[fields.length - 1]?.rank,
					numberOfRanks: 1,
				})
				if (kind === "condition") {
					append({
						kind: "condition",
						type: AutomationConditionType.jsonata,
						expression: "",
						rank: ranks[0],
					})
					return
				}
				append({
					kind: "block",
					type: AutomationConditionBlockType.AND,
					rank: ranks[0],
					items: [],
				})
			},
			[append, fields]
		)

		const handleRemove = useCallback(
			(index: number) => {
				remove(index)
			},
			[remove]
		)

		const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
			useSortable({
				id,
			})

		const isNot = blockType === AutomationConditionBlockType.NOT
		const maxDepth = 3
		const canNest = depth < maxDepth

		const style = {
			transform: CSS.Translate.toString(transform),
			transition,
		}

		return (
			<Item
				ref={setNodeRef}
				style={style}
				className={cn(
					isDragging && "z-10 cursor-grabbing",
					depth % 2 === 1 && "bg-card",
					depth % 2 === 0 && depth > 0 && "bg-muted/50",
					depth > 0 ? "border-l-4 border-l-blue-100! p-0.5 py-2" : "border-none p-0",
					rootItemError && "border-red-300"
				)}
			>
				<ItemHeader>
					<div className="flex items-center gap-1">
						{depth > 0 && (
							<Button
								type="button"
								aria-label="Drag handle"
								size="icon-sm"
								variant="ghost"
								className={cn("cursor-grab p-1", isDragging && "cursor-grabbing")}
								{...listeners}
								{...attributes}
							>
								<GripVertical size={14} className="text-muted-foreground" />
							</Button>
						)}
						{depth === 0 && (
							<Label className="font-semibold text-muted-foreground text-xs uppercase">
								When
							</Label>
						)}
						<Controller
							control={control}
							name={`${slug}.type`}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={(value) =>
										field.onChange(value as AutomationConditionBlockType)
									}
								>
									<SelectTrigger className="h-8! w-24 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.values(AutomationConditionBlockType).map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					{depth > 0 && onRemove && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground text-xs hover:text-destructive"
							onClick={onRemove}
						>
							<X size={14} />
						</Button>
					)}
				</ItemHeader>
				<ItemContent className="flex w-full items-start gap-2">
					<div className="w-full space-y-2">
						<DndContext
							id={itemId}
							modifiers={[restrictToVerticalAxis, restrictToParentElement]}
							onDragEnd={handleDragEnd}
							sensors={sensors}
						>
							<SortableContext items={fields} strategy={verticalListSortingStrategy}>
								{fields.map((arrayField, index) => (
									<Controller
										control={control}
										key={arrayField.id}
										name={`${slug}.items.${index}`}
										render={({ field, fieldState }) =>
											field.value?.kind === "condition" ? (
												<ConditionItem
													id={arrayField.id}
													fieldState={fieldState}
													expression={field.value.expression}
													onRemove={() => handleRemove(index)}
													onChange={(value) => {
														field.onChange({
															...field.value,
															expression: value,
														})
													}}
												/>
											) : (
												<ConditionBlock
													control={controlProp}
													id={arrayField.id}
													fieldState={fieldState}
													depth={depth + 1}
													onRemove={() => handleRemove(index)}
													slug={`${slug}.items.${index}`}
												/>
											)
										}
									/>
								))}
							</SortableContext>
						</DndContext>
						<div className="flex gap-4 pt-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 p-0 text-muted-foreground text-xs"
								onClick={() => handleAdd("condition")}
								disabled={
									isNot &&
									fields.filter((field) => field.kind === "condition").length >= 1
								}
							>
								<Plus size={14} />
								Add condition
							</Button>
							{canNest && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-8 p-0 text-muted-foreground text-xs"
									onClick={() => handleAdd("block")}
									disabled={
										isNot &&
										(fields.filter((field) => field.kind === "condition")
											.length >= 1 ||
											fields.filter((field) => field.kind === "block")
												.length >= 1)
									}
								>
									<Plus size={14} />
									Add block
								</Button>
							)}
						</div>

						{isNot &&
							(fields.filter((field) => field.kind === "condition").length >= 1 ||
								fields.filter((field) => field.kind === "block").length >= 1) && (
								<p className="text-destructive text-xs">
									NOT blocks can only contain one condition or one block
								</p>
							)}
					</div>
					{rootItemError && (
						<p className="text-destructive text-xs">
							{rootItemError.type === "too_small"
								? "Block cannot be empty"
								: rootItemError.message}
						</p>
					)}
				</ItemContent>
			</Item>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.id === nextProps.id &&
			prevProps.slug === nextProps.slug &&
			prevProps.depth === nextProps.depth &&
			prevProps.fieldState.invalid === nextProps.fieldState.invalid &&
			prevProps.fieldState.error === nextProps.fieldState.error
		)
	}
)

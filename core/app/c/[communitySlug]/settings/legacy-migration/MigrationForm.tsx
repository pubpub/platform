"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId } from "db/public"
import type { getToBeDeletedStructure } from "~/lib/server/legacy-migration/legacy-cleanup"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { UndoIcon } from "lucide-react"
import { parseAsBoolean, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { pubFieldsIdSchema, pubsIdSchema, pubTypesIdSchema } from "db/public"
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ui/alert-dialog"
import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form"
import { Input } from "ui/input"
import { FormSubmitButton } from "ui/submit-button"
import { toast } from "ui/use-toast"

import { DataTable } from "~/app/components/DataTable/v2/DataTable"
import { getPubTitle } from "~/lib/pubs"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { importFromLegacy, undoMigration } from "./actions"

const migrationFormSchema = z.object({
	file: z.instanceof(File),
})
export type MigrationFormSchema = z.infer<typeof migrationFormSchema>

export function MigrationForm() {
	const form = useForm<z.infer<typeof migrationFormSchema>>({
		resolver: zodResolver(migrationFormSchema),
	})

	const runImportFromLegacy = useServerAction(importFromLegacy)

	const onSubmit = async (data: MigrationFormSchema) => {
		const result = await runImportFromLegacy(data)

		if (didSucceed(result)) {
			toast.success("Import successful!")
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="file"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>Legacy Community Export</FormLabel>
							<Input
								type="file"
								accept="application/json"
								onChange={(e) => {
									field.onChange(e.target.files?.[0])
								}}
							/>
							<FormDescription>
								Upload the <code>export.json</code> file that's included in the{" "}
								<code>.zip</code> file from your Legacy export
							</FormDescription>
							<FormMessage />
							<FormSubmitButton
								formState={form.formState}
								idleText="Import from Legacy"
								pendingText="Importing..."
								successText="Import successful"
							/>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)
}

const undoMigrationFormSchema = z.object({
	pubTypes: z.record(pubTypesIdSchema, z.boolean()),
	pubFields: z.record(pubFieldsIdSchema, z.boolean()),
	pubs: z.record(pubsIdSchema, z.boolean()),
})

export function UndoMigrationForm({
	community,
	toBeDeletedStructure,
}: {
	community: { slug: string; id: CommunitiesId }
	toBeDeletedStructure: Awaited<ReturnType<typeof getToBeDeletedStructure>> | undefined
}) {
	const form = useForm({
		resolver: zodResolver(undoMigrationFormSchema),
		defaultValues: {
			pubTypes: Object.fromEntries(
				toBeDeletedStructure?.pubTypes.map((pt) => [pt.id, true]) ?? []
			),
			pubFields: Object.fromEntries(
				toBeDeletedStructure?.pubFields.map((pf) => [pf.id, true]) ?? []
			),
			pubs: Object.fromEntries(toBeDeletedStructure?.pubs.map((p) => [p.id, true]) ?? []),
		},
	})

	const [undo, setUndo] = useQueryState(
		"undo",
		parseAsBoolean.withDefault(false).withOptions({
			shallow: false,
		})
	)
	const actualSetUndo = (value: boolean) => {
		setUndo(value)
	}

	const runUndoMigration = useServerAction(undoMigration)

	const onSubmit = form.handleSubmit(async (data) => {
		const pubTypesNotToDelete = Object.keys(data.pubTypes).filter(
			(key) => !data.pubTypes[key]
		) as PubTypesId[]
		const pubFieldsNotToDelete = Object.keys(data.pubFields).filter(
			(key) => !data.pubFields[key]
		) as PubFieldsId[]
		const pubsNotToDelete = Object.keys(data.pubs).filter((key) => !data.pubs[key]) as PubsId[]

		const result = await runUndoMigration({
			pubTypesNotToDelete,
			pubFieldsNotToDelete,
			pubsNotToDelete,
		})

		if (didSucceed(result)) {
			toast.success("Migration undone")

			setUndo(false)
		}
	})

	const selectedPubTypes = form.watch("pubTypes") as Record<PubTypesId, boolean>
	const selectedPubFields = form.watch("pubFields")
	const selectedPubs = form.watch("pubs")

	const unselectableFields = useMemo(() => {
		return (
			toBeDeletedStructure?.pubFields
				.filter((pf) => !selectedPubTypes[pf.B!])
				.map((pf) => pf.id) ?? []
		)
	}, [toBeDeletedStructure, selectedPubTypes])

	const getSelectedCount = (values: Record<string, boolean> | undefined) => {
		if (!values) return 0
		return Object.values(values).filter(Boolean).length
	}

	const renderCheckbox = (
		itemId: string,
		name: `${"pubs" | "pubTypes" | "pubFields"}.${string}`,
		isDisabled = false
	) => (
		<FormField
			key={itemId}
			control={form.control}
			name={name}
			render={({ field }) => (
				<Checkbox
					id={itemId}
					checked={isDisabled ? false : field.value}
					onCheckedChange={isDisabled ? undefined : field.onChange}
					disabled={isDisabled}
				/>
			)}
		/>
	)

	const handleSelectAll = (
		fieldName: "pubTypes" | "pubFields" | "pubs",
		items: any[],
		checked: boolean,
		filter?: (id: string) => boolean
	) => {
		const newValues: Record<string, boolean> = {}
		items.forEach((item) => {
			if (!filter || filter(item.id)) {
				newValues[item.id] = checked
			} else {
				newValues[item.id] = form.getValues(`${fieldName}.${item.id}`)
			}
		})
		form.setValue(fieldName, newValues)
	}

	const pubTypeColumns = useMemo(() => {
		return [
			{
				id: "select",
				header: () => (
					<Checkbox
						checked={
							toBeDeletedStructure?.pubTypes.length
								? getSelectedCount(selectedPubTypes) ===
									toBeDeletedStructure.pubTypes.length
								: false
						}
						onCheckedChange={(checked) =>
							handleSelectAll(
								"pubTypes",
								toBeDeletedStructure?.pubTypes || [],
								!!checked
							)
						}
					/>
				),
				cell: ({ row }) => renderCheckbox(row.original.id, `pubTypes.${row.original.id}`),
				size: 40,
			},
			{
				id: "name",
				header: "Name",
				accessorFn: (row) => row.name || row.id,
				cell: ({ row }) => (
					<span className="truncate">{row.original.name || row.original.id}</span>
				),
			},
		] satisfies ColumnDef<NonNullable<typeof toBeDeletedStructure>["pubTypes"][number]>[]
	}, [toBeDeletedStructure, selectedPubTypes])

	const pubFieldColumns = useMemo(() => {
		return [
			{
				id: "select",
				header: () => (
					<Checkbox
						checked={Boolean(
							toBeDeletedStructure?.pubFields.length &&
								getSelectedCount(selectedPubFields) ===
									toBeDeletedStructure.pubFields.filter(
										(f) => !unselectableFields.includes(f.id)
									).length
						)}
						onCheckedChange={(checked) =>
							handleSelectAll(
								"pubFields",
								toBeDeletedStructure?.pubFields || [],
								!!checked,
								(id) => !unselectableFields.includes(id as PubFieldsId)
							)
						}
					/>
				),
				cell: ({ row }) =>
					renderCheckbox(
						row.original.id,
						`pubFields.${row.original.id}`,
						unselectableFields.includes(row.original.id)
					),
				size: 40,
			},
			{
				id: "name",
				header: "Name",
				accessorFn: (row) => row.name || row.slug || row.id,
				cell: ({ row }) => (
					<span className="truncate">
						{row.original.name || row.original.slug || row.original.id}
					</span>
				),
			},
		] satisfies ColumnDef<NonNullable<typeof toBeDeletedStructure>["pubFields"][number]>[]
	}, [
		toBeDeletedStructure,
		selectedPubFields,
		unselectableFields,
		getSelectedCount,
		handleSelectAll,
		renderCheckbox,
	])

	const pubColumns = useMemo(() => {
		return [
			{
				id: "select",
				header: () => (
					<Checkbox
						checked={Boolean(
							toBeDeletedStructure?.pubs.length &&
								getSelectedCount(selectedPubs) === toBeDeletedStructure.pubs.length
						)}
						onCheckedChange={(checked) =>
							handleSelectAll("pubs", toBeDeletedStructure?.pubs || [], !!checked)
						}
					/>
				),
				cell: ({ row }) => renderCheckbox(row.original.id, `pubs.${row.original.id}`),
				size: 40,
			},
			{
				id: "name",
				header: "Name",
				accessorFn: (row) => getPubTitle(row),
				cell: ({ row }) => (
					<span className="block max-w-full truncate">{getPubTitle(row.original)}</span>
				),
			},
			{
				id: "type",
				header: "Type",
				accessorFn: (row) => row.pubTypeId || "Unknown",
				cell: ({ row }) => (
					<span className="truncate">
						{toBeDeletedStructure?.pubTypes.find(
							(pt) => pt.id === row.original.pubTypeId
						)?.name || "Unknown"}
					</span>
				),
			},
		] satisfies ColumnDef<NonNullable<typeof toBeDeletedStructure>["pubs"][number]>[]
	}, [toBeDeletedStructure, selectedPubs, getSelectedCount, handleSelectAll, renderCheckbox])

	return (
		<AlertDialog open={undo} onOpenChange={actualSetUndo}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<UndoIcon className="mr-1 h-4 w-4" /> Undo Migration
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-w-(--breakpoint-lg)">
				<AlertDialogTitle>Undo Migration</AlertDialogTitle>
				<AlertDialogDescription>
					Select what data you want to be deleted
				</AlertDialogDescription>

				<Form {...form}>
					<form onSubmit={onSubmit} className="flex flex-col gap-2">
						<div className="max-h-[70vh] overflow-y-auto">
							<FormItem>
								<FormLabel>
									Pub Types ({getSelectedCount(selectedPubTypes)} of{" "}
									{toBeDeletedStructure?.pubTypes.length || 0} selected)
								</FormLabel>
								<FormControl>
									<DataTable
										className="max-h-60 overflow-y-auto"
										pagination={{
											pageIndex: 0,
											pageSize: 1000,
										}}
										// onRowClick={(row) => {
										// 	form.setValue(
										// 		`pubTypes.${row.original.id}`,
										// 		!form.getValues(`pubTypes.${row.original.id}`)
										// 	);
										// }}
										columns={pubTypeColumns}
										data={toBeDeletedStructure?.pubTypes ?? []}
										getRowId={(row) => row.id}
										stickyHeader
									/>
								</FormControl>
							</FormItem>

							<FormItem>
								<FormLabel>
									Pub Fields ({getSelectedCount(selectedPubFields)} of{" "}
									{toBeDeletedStructure?.pubFields.length || 0} selected)
								</FormLabel>
								<FormControl>
									<div className="max-h-60 overflow-y-auto">
										<DataTable
											pagination={{
												pageIndex: 0,
												pageSize: 1000,
											}}
											stickyHeader
											// onRowClick={(row) => {
											// 	form.setValue(
											// 		`pubFields.${row.original.id}`,
											// 		!form.getValues(`pubFields.${row.original.id}`)
											// 	);
											// }}
											columns={pubFieldColumns}
											data={toBeDeletedStructure?.pubFields ?? []}
											getRowId={(row) => row.id}
										/>
									</div>
								</FormControl>
							</FormItem>

							<FormItem>
								<FormLabel>
									Pubs ({getSelectedCount(selectedPubs)} of{" "}
									{toBeDeletedStructure?.pubs.length || 0} selected)
								</FormLabel>
								<FormControl>
									<div className="max-h-60 overflow-y-auto">
										<DataTable
											pagination={{
												pageIndex: 0,
												pageSize: 1000,
											}}
											stickyHeader
											// onRowClick={(row) => {
											// 	form.setValue(
											// 		`pubs.${row.original.id}`,
											// 		!form.getValues(`pubs.${row.original.id}`)
											// 	);
											// }}
											columns={pubColumns}
											data={toBeDeletedStructure?.pubs ?? []}
											getRowId={(row) => row.id}
										/>
									</div>
								</FormControl>
							</FormItem>
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel type="button">Cancel</AlertDialogCancel>
							{/* <AlertDialogAction asChild> */}
							<FormSubmitButton
								formState={form.formState}
								idleText="Undo Migration"
								pendingText="Undoing Migration..."
								successText="Migration Undone"
							/>
							{/* </AlertDialogAction> */}
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	)
}

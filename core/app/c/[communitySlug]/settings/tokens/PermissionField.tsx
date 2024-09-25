"use client";

import type { ApiAccessScope } from "db/public";
import type { ApiAccessPermissionConstraintsInput, CreateTokenFormContext } from "db/types";
import { ApiAccessType } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiSelect } from "ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import type { CreateTokenForm } from "./CreateTokenForm";

/**
 * This is a type for a configuration object for form fields. It allows you to specify
 * what a certain Permission form field does in a type-safe way, depending on the earlier
 * configuration of the `permissionsSchema`.
 *
 * Roughly this type means:
 *
 * Turn a type that looks like this,
 * where `boolean | undefined` means that the field can be set to `true` or `false`, and
 * `boolean | { stages: Stages[] } | undefined` means that the field can be set to `true` or `false`,
 * or to an object with a `stages` field that is an array of stages:
 * ```ts
 * type InputShape =  {
 * 	 community: {
 * 		read: boolean | undefined
 *   },
 *   pub: {
 * 		write: boolean | {
 * 			stages: Stages[]
 * 		} | undefined
 *   }
 * }
 * ```
 * into a type that looks like
 * ```ts
 * {
 * 	 community: {
 * 		read: ({ context, form, value, onChange }: {
 * 			context: CreateTokenFormContext;
 * 			form: CreateTokenForm;
 * 			value: boolean;
 * 			onChange: (...args: any[]) => void;
 *        }) => JSX.Element
 * },
 *   pub: {
 * 		write?: ({ context, form, value, onChange }: {
 * 			context: CreateTokenFormContext;
 * 			form: CreateTokenForm;
 * 			value: boolean | {
 * 				stages: Stages[]
 * 			};
 * 			onChange: (...args: any[]) => void;
 *        }) => JSX.Element
 *   } | undefined
 * }
 * ```
 * The idea is that you can customize what form fields look like depending on the
 * `permissionsSchema` configuration.
 * E.g. the `write` field of the `pub` scope can be configured to only write to specific stages.
 * You should be able to configure a custom element to do this.
 *
 */
type PermissionContraintMap = {
	[K in keyof ApiAccessPermissionConstraintsInput as ApiAccessPermissionConstraintsInput[K] extends never
		? never
		: K]: {
		[T in keyof ApiAccessPermissionConstraintsInput[K]]: ({
			form,
			context,
			value,
		}: {
			form: CreateTokenForm;
			context: CreateTokenFormContext;
			value: boolean | ApiAccessPermissionConstraintsInput[K][T];
			onChange: (...args: any[]) => void;
		}) => JSX.Element;
	};
};

/**
 * Here you configure the specific form elements for each permission type
 */
const permissionContraintMap: PermissionContraintMap = {
	community: {},
	pub: {
		write: ({ context, form, value, onChange }) => (
			<div className="flex flex-col gap-2">
				<h3 className="text-lg font-semibold">Stages</h3>
				<span className="text-sm text-muted-foreground">
					Select the stages this token can create pubs in/move pubs to
				</span>
				<MultiSelect
					variant="inverted"
					options={context.stages.map((stage) => ({
						label: stage.name,
						value: stage.id,
					}))}
					/**
					 * This just means: if it is set to `true`, allow it to act on all stages.
					 * If it is set to `false`, allow it to act on no stages.
					 * Otherwise just reuse the value of the `stages` field. (this is a bit of a cop-out as this situation should never come to pass)
					 */
					defaultValue={
						value === true
							? context.stages.map((stage) => stage.id)
							: !value
								? []
								: value.stages
					}
					onValueChange={(value) => {
						onChange(
							value.length > 0 && value.length !== context.stages.length
								? { stages: value }
								: true
						);
					}}
					animation={0}
				/>
			</div>
		),
	},
	stage: {
		read: ({ context, form, value, onChange }) => (
			<div className="flex flex-col gap-2">
				<h3 className="text-lg font-semibold">Stages</h3>
				<span className="text-sm text-muted-foreground">
					Select the stages this token can read
				</span>
				<MultiSelect
					variant="inverted"
					options={context.stages.map((stage) => ({
						label: stage.name,
						value: stage.id,
					}))}
					defaultValue={
						value === true
							? context.stages.map((stage) => stage.id)
							: !value
								? []
								: value.stages
					}
					onValueChange={(value) => {
						onChange(value.length > 0 ? value : true);
					}}
					animation={0}
				/>
			</div>
		),
	},
	member: {},
	pubType: {},
};

export const PermissionField = ({
	form,
	name,
	prettyName,
	context,
}: {
	form: CreateTokenForm;
	name: ApiAccessScope;
	prettyName: string;
	context: CreateTokenFormContext;
}) => {
	return (
		<FormField
			control={form.control}
			name={`permissions.${name}`}
			render={({ field }) => (
				<div className="">
					<h3 className="text-sm">{prettyName}</h3>
					<div className="grid h-10 grid-cols-3 gap-2">
						{Object.values(ApiAccessType).map((type) => (
							<FormField
								key={type}
								control={form.control}
								name={`permissions.${name}.${type}`}
								render={({ field }) => {
									const extraContraints = permissionContraintMap[name]?.[type];

									return (
										<FormItem className="flex items-center gap-x-2 space-y-0">
											<FormControl>
												<Checkbox
													checked={Boolean(field.value)}
													onCheckedChange={(change) => {
														if (typeof change === "boolean") {
															field.onChange(change);
														}
													}}
												/>
											</FormControl>
											<FormLabel>{type}</FormLabel>
											<FormMessage />
											{field.value && extraContraints && (
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="secondary"
															type="button"
															size="sm"
														>
															Options
														</Button>
													</PopoverTrigger>
													<PopoverContent>
														{extraContraints({
															context,
															form,
															// @ts-ignore FIXME: add better error handling
															value: field.value,
															onChange: field.onChange,
														})}
													</PopoverContent>
												</Popover>
											)}
										</FormItem>
									);
								}}
							/>
						))}
					</div>
				</div>
			)}
		/>
	);
};

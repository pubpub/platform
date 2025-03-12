"use client";

import type { ControllerRenderProps } from "react-hook-form";

import { useContext, useMemo } from "react";

import type { ApiAccessScope, PubTypesId, StagesId } from "db/public";
import type { ApiAccessPermissionConstraintsInput } from "db/types";
import { ApiAccessType } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiSelect } from "ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import type { CreateTokenForm, CreateTokenFormSchema } from "./CreateTokenForm";
import { CreateTokenFormContext } from "./CreateTokenFormContext";

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
 * 		read: boolean | undefined,
 * 		write: boolean | {
 * 			stages: Stages[]
 * 		} | undefined
 *   }
 * }
 * ```
 * into a type that looks like
 * ```ts
 * {
 * 	 community: null,
 *   pub: {
 * 		write: ({ context, form, value, onChange }: {
 * 			value: boolean | {
 * 				stages: Stages[]
 * 			};
 * 			onChange: (...args: any[]) => void;
 *        }) => JSX.Element
 *   }
 * }
 * ```
 * The idea is that you mustcustomize what form fields look like depending on the
 * `permissionsSchema` configuration.
 * E.g. the `write` field of the `pub` scope can be configured to only write to specific stages.
 * You should be able to configure a custom element to do this.
 *
 */
type PermissionContraintMap<I = ApiAccessPermissionConstraintsInput> = {
	[K in ScopesWithSpecialConstraint<I>]: {
		[T in SpecialConstraintKeys<I[K]>]: CustomConstraintFormElement<I[K][T]>;
	} & {
		[T in NormalConstraintKeys<I[K]>]?: undefined;
	};
} & {
	[K in ScopesWithOnlyNormalConstraints<I>]: null;
};

/**
 * The keys of a scope that have a constraint different from `boolean | undefined`
 *
 * @example
 * type Keys = SpecialConstraintKeys<{
 * 	write: boolean | undefined
 * 	read: boolean | {
 * 		stages: Stages[]
 * 	}
 * }>
 * // Keys = 'read', because it has a signature different from `boolean | undefined`
 */
type SpecialConstraintKeys<Scope, Keys extends keyof Scope = keyof Scope> = Keys extends Keys
	? Scope[Keys] extends boolean | undefined
		? never
		: Keys
	: never;

type NormalConstraintKeys<Scope, Keys extends keyof Scope = keyof Scope> = Exclude<
	Keys,
	SpecialConstraintKeys<Scope, Keys>
>;

/**
 * Only those scopes that have a constraint different from `boolean | undefined`
 *
 * @example
 * type Keys = ScopesWithSpecialConstraint<{
 *   pub: {
 *     write: boolean | undefined | number
 *   },
 *   community: {
 *     read: boolean | undefined
 *   }
 * }>
 * // Keys = 'pub', because it has a signature different from `boolean | undefined`
 *
 */
type ScopesWithSpecialConstraint<
	I = ApiAccessPermissionConstraintsInput,
	K extends keyof I = keyof I,
> = K extends K
	? keyof I[K] extends NormalConstraintKeys<I[K]>
		? never // this means the scope only has normal constraints
		: K
	: never;

type ScopesWithOnlyNormalConstraints<
	I = ApiAccessPermissionConstraintsInput,
	K extends keyof I = keyof I,
> = Exclude<K, ScopesWithSpecialConstraint<I, K>>;

type CustomConstraintFormElement<Value> = (props: {
	value: boolean | Value;
	onChange: (value: boolean | Value) => void;
}) => React.ReactNode;

/**
 * Here you configure the specific form elements for each permission type
 */
const permissionContraintMap: PermissionContraintMap = {
	community: null,
	pub: {
		[ApiAccessType.read]: ({ value, onChange }) => {
			const context = useContext(CreateTokenFormContext);

			return (
				<div className="flex flex-col gap-2">
					<h3 className="font-semibold">Stages</h3>
					<span className="text-xs text-muted-foreground">
						Select the stages this token can read Pubs from
					</span>
					<MultiSelect
						showClearAll={false}
						variant="inverted"
						options={context.stages.allOptions}
						defaultValue={
							value === true || !value ? context.stages.allValues : value.stages
						}
						onValueChange={(val) => {
							const allStagesSelected =
								val.length === context.stages.allValues.length;

							const allPubTypesSelected =
								typeof value === "object" &&
								value.pubTypes?.length === context.pubTypes.allValues.length;

							if (allStagesSelected && allPubTypesSelected) {
								onChange(true);
								return;
							}

							if (val.length === 0) {
								// do not allow the length to be set to 0
								return;
							}

							onChange({
								stages: val as StagesId[],
								pubTypes:
									typeof value === "object"
										? value.pubTypes
										: context.pubTypes.allValues,
							});
						}}
						animation={0}
						data-testid={`pub-${ApiAccessType.read}-stages-select`}
					/>

					<h3 className="font-semibold">Types</h3>
					<span className="text-xs text-muted-foreground">
						Select the types of Pubs this token can read
					</span>
					<MultiSelect
						showClearAll={false}
						variant="inverted"
						options={context.pubTypes.allOptions}
						defaultValue={
							value === true || !value ? context.pubTypes.allValues : value.pubTypes
						}
						onValueChange={(val) => {
							const allPubTypesSelected =
								val.length === context.pubTypes.allValues.length;

							const allStagesSelected =
								typeof value === "object" &&
								value.stages?.length === context.stages.allValues.length;

							if (allStagesSelected && allPubTypesSelected) {
								onChange(true);
								return;
							}

							if (val.length === 0) {
								// do not allow the length to be set to 0
								return;
							}

							onChange({
								pubTypes: val as PubTypesId[],
								stages:
									typeof value == "object"
										? value.stages
										: context.stages.allValues,
							});
						}}
						animation={0}
						data-testid={`pub-${ApiAccessType.read}-pubTypes-select`}
					/>
				</div>
			);
		},
		[ApiAccessType.write]: ({ value, onChange }) => {
			const context = useContext(CreateTokenFormContext);
			return (
				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-semibold">Stages</h3>
					<span className="text-sm text-muted-foreground">
						Select the stages this token can create pubs in/move pubs to
					</span>
					<MultiSelect
						variant="inverted"
						options={context.stages.allOptions}
						/**
						 * This just means: if it is set to `true`, allow it to act on all stages.
						 * If it is set to `false`, allow it to act on no stages.
						 * Otherwise just reuse the value of the `stages` field. (this is a bit of a cop-out as this situation should never come to pass)
						 */
						defaultValue={
							value === true || !value ? context.stages.allValues : value.stages
						}
						onValueChange={(value) => {
							onChange(
								value.length > 0 && value.length !== context.stages.allValues.length
									? { stages: value as StagesId[] }
									: true
							);
						}}
						animation={0}
						data-testid={`pub-${ApiAccessType.write}-stages-select`}
					/>
				</div>
			);
		},
	},
	stage: {
		[ApiAccessType.read]: ({ value, onChange }) => {
			const context = useContext(CreateTokenFormContext);
			return (
				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-semibold">Stages</h3>
					<span className="text-sm text-muted-foreground">
						Select the stages this token can read
					</span>
					<MultiSelect
						variant="inverted"
						options={context.stages.allOptions}
						defaultValue={
							value === true || !value ? context.stages.allValues : value.stages
						}
						onValueChange={(value) => {
							onChange(value.length > 0 ? { stages: value as StagesId[] } : true);
						}}
						animation={0}
						data-testid={`stage-${ApiAccessType.read}-stages-select`}
					/>
				</div>
			);
		},
	},
	member: null,
	pubType: null,
};

export const PermissionField = ({
	form,
	name,
	prettyName,
}: {
	form: CreateTokenForm;
	name: ApiAccessScope;
	prettyName: string;
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
								render={ConstraintFormFieldRender}
							/>
						))}
					</div>
				</div>
			)}
		/>
	);
};

function FormItemWrapper({
	children,
	checked,
	onChange,
	type,
	dataTestId,
}: {
	children?: React.ReactNode;
	checked: boolean | "indeterminate";
	onChange: (change: boolean) => void;
	type: ApiAccessType;
	dataTestId: string;
}) {
	return (
		<FormItem className="flex items-center gap-x-2 space-y-0">
			<FormControl>
				<Checkbox
					data-testid={dataTestId}
					checked={checked}
					onCheckedChange={(change) => {
						if (typeof change === "boolean") {
							onChange(change);
						}
					}}
				/>
			</FormControl>
			<FormLabel>{type}</FormLabel>
			{children}
			<FormMessage />
		</FormItem>
	);
}

type SplitPath<Path extends `${string}.${string}.${string}`> =
	Path extends `${infer _permissions extends "permissions"}.${infer scope extends ApiAccessScope}.${infer type extends ApiAccessType}`
		? [_permissions, scope, type]
		: never;

export const ConstraintFormFieldRender = ({
	field,
}: {
	field: ControllerRenderProps<
		CreateTokenFormSchema,
		`permissions.${ApiAccessScope}.${ApiAccessType}`
	>;
}) => {
	const [_permissions, scope, type] = field.name.split(".") as SplitPath<typeof field.name>;

	const ExtraContrainstsFormItem = useMemo(() => {
		const scopeConstraints = permissionContraintMap[scope];

		if (!scopeConstraints || !(type in scopeConstraints)) {
			return null;
		}

		if (!(type in scopeConstraints)) {
			return null;
		}

		const ExtraContraints = scopeConstraints[type];

		if (!ExtraContraints) {
			return null;
		}

		// brief explanation:
		// ExtraContraints ends up being a nice union of all possible Components
		// that have extra cosntraints
		// however, a union of functions leads to the parameters of those functions being intersected
		// consider the union function
		// `declare function f: ((a: string) => void) | ((a: number) => void)`
		// you would think: the first param of F is either a string or a number
		// but when you call `f(4)` you get an error, as the first param is expected to be
		// `string & number` which is `never`, not `string | number`.
		// this is extremely annoying behaviour

		// what we do here is basically pre-emptively get the parameters of the function
		// for our example, `Parameters<f>[0]` _is_ `string | number`, even though
		// when you call `f(4)` you get an error.
		// we do the same below

		type ExtraParams = Parameters<typeof ExtraContraints>[0];

		const CorrectlyTypedExtraContraints = ExtraContraints as (
			props: ExtraParams
		) => React.ReactNode;

		return CorrectlyTypedExtraContraints;
	}, [scope, type]);

	if (!ExtraContrainstsFormItem) {
		return (
			<FormItemWrapper
				dataTestId={`${scope}-${type}-checkbox`}
				checked={Boolean(field.value)}
				onChange={field.onChange}
				type={type}
			/>
		);
	}

	return (
		<FormItemWrapper
			dataTestId={`${scope}-${type}-checkbox`}
			checked={typeof field.value === "object" ? "indeterminate" : Boolean(field.value)}
			onChange={field.onChange}
			type={type}
		>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="secondary"
						type="button"
						size="sm"
						data-testid={`${scope}-${type}-options`}
					>
						Options
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<ExtraContrainstsFormItem value={field.value} onChange={field.onChange} />
				</PopoverContent>
			</Popover>
		</FormItemWrapper>
	);
};

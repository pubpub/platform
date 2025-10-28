import type { PropsWithChildren } from "react";
import type { ControllerProps, ControllerRenderProps, FieldValues } from "react-hook-form";
import type z from "zod";

import { useEffect, useState } from "react";
import { AlertCircle, Braces, CheckCircle2, Loader2, TestTube, X } from "lucide-react";
import { Controller } from "react-hook-form";

import type { Action as ActionEnum, PubsId } from "db/public";
import { Alert, AlertDescription } from "ui/alert";
import { Button } from "ui/button";
import { ButtonGroup } from "ui/button-group";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Switch } from "ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Textarea } from "ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { ActionFormContextContext, ActionFormContextContextValue } from "./ActionFormProvider";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { client } from "~/lib/api";
import { action } from "../buildJournalSite/action";
import { useActionForm } from "./ActionFormProvider";
import { isJsonTemplate } from "./schemaWithJsonFields";

type ActionFieldProps = PropsWithChildren<{
	name: string;
	label?: string;
	render?: ControllerProps<any>["render"];
	id?: string;
}>;

type JsonState =
	| {
			state: "json";
			jsonValue: string;
			normalValue: string;
	  }
	| {
			state: "normal";
			normalValue: string;
			jsonValue: string;
	  };

export function ActionField(props: ActionFieldProps) {
	const { form, schema, defaultFields, context, action } = useActionForm();
	const innerSchema = schema._def?.innerType || schema;
	const schemaShape = innerSchema?.shape ?? {};
	const fieldSchema = schemaShape[props.name] as z.ZodType<any>;
	const required = fieldSchema && !fieldSchema.isOptional();
	const isDefaultField = defaultFields.includes(props.name);
	const val = form.getValues()?.[props.name];
	const isJson = isJsonTemplate(val);
	const [jsonState, setJsonState] = useState<JsonState>({
		state: isJson ? "json" : "normal",
		jsonValue: isJson ? val : "",
		normalValue: isJson ? "" : val,
	});

	const toggleJsonState = () => {
		setJsonState((prev) => ({
			...prev,
			state: jsonState.state === "json" ? "normal" : "json",
		}));
	};

	useEffect(() => {
		setJsonState((prev) => ({
			...prev,
			jsonValue: prev.state === "json" ? val : prev.jsonValue,
			normalValue: prev.state === "normal" ? val : prev.normalValue,
		}));
	}, [val]);

	return (
		<Controller
			name={props.name}
			control={form.control}
			render={(p) => {
				return (
					<Field data-invalid={p.fieldState.invalid}>
						<div className="flex flex-row items-center justify-between space-x-2">
							{props.label && (
								<FieldLabel htmlFor={p.field.name} aria-required={required}>
									{props.label}
									{required && <span className="-ml-1 text-red-500">*</span>}
								</FieldLabel>
							)}
							<Button
								variant="outline"
								size="icon"
								type="button"
								className={cn(
									"font-mono font-semibold text-gray-900 hover:bg-amber-50",
									"transition-colors duration-200",

									jsonState.state === "json" &&
										"border-orange-400 bg-orange-50 text-orange-900"
								)}
								onClick={() => {
									p.field.onChange(
										jsonState.state === "json"
											? jsonState.normalValue
											: jsonState.jsonValue
									);

									toggleJsonState();
								}}
							>
								<Braces size={6} />
							</Button>
						</div>
						{jsonState.state === "json" ? (
							<JsonInput
								field={p.field}
								isDefaultField={isDefaultField}
								actionName={action.name}
								configKey={props.name}
								pubId={context.type === "run" ? context.pubId : undefined}
								context={context}
								actionAccepts={action.accepts}
								value={p.field.value ?? ""}
								jsonState={jsonState}
							/>
						) : (
							(props.render?.(p) ?? (
								<Input
									type="text"
									className="bg-white"
									placeholder={isDefaultField ? "(use default)" : undefined}
									{...p.field}
									id={p.field.name}
									value={p.field.value ?? ""}
									aria-invalid={p.fieldState.invalid}
								/>
							))
						)}
						<FieldDescription>{fieldSchema.description}</FieldDescription>
						{p.fieldState.invalid && <FieldError errors={[p.fieldState.error]} />}
					</Field>
				);
			}}
		/>
	);
}

type TestInputType = "current-pub" | "select-pub" | "json-blob";

function getDefaultTestInputType(
	contextType: string,
	pubId: PubsId | undefined,
	actionAccepts: readonly string[]
): TestInputType {
	if (contextType === "run" && pubId) {
		return "current-pub";
	}
	if (actionAccepts.includes("json")) {
		return "json-blob";
	}
	return "select-pub";
}

export function JsonInput(props: {
	field: ControllerRenderProps<FieldValues, any>;
	isDefaultField: boolean;
	actionName: ActionEnum;
	configKey: string;
	pubId: PubsId | undefined;
	context: ActionFormContextContext;
	actionAccepts: readonly string[];
	value: string;
	jsonState: JsonState;
}) {
	const {
		isDefaultField,
		actionName,
		configKey,
		field,
		context,
		actionAccepts,
		value,
		jsonState,
	} = props;
	const shouldShowTest =
		jsonState.state === "json" &&
		isJsonTemplate(field.value) &&
		(context.type === "run" ||
			context.type === "configure" ||
			context.type === "automation" ||
			(context.type === "default" && actionAccepts.includes("json")));

	const [isTestOpen, setIsTestOpen] = useState(false);

	return (
		<>
			<ButtonGroup>
				<Input
					type="text"
					className="border-amber-400 bg-amber-50/10 font-mono font-medium text-gray-900 focus:border-amber-400 focus-visible:ring-amber-400"
					placeholder={isDefaultField ? "(use default)" : undefined}
					{...field}
					id={field.name}
					value={field.value ?? ""}
					aria-invalid={field.invalid}
				/>
				{shouldShowTest && (
					<Tooltip delayDuration={500}>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								aria-label={isTestOpen ? "Close test" : "Open test"}
								className="border-amber-400 bg-amber-50/10 font-mono font-semibold text-amber-700 hover:bg-amber-50 focus:shadow-none"
								onClick={() => setIsTestOpen(!isTestOpen)}
							>
								{isTestOpen ? <X size={6} /> : <TestTube size={6} />}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isTestOpen ? "Close test" : "Test the result of this field"}
						</TooltipContent>
					</Tooltip>
				)}
			</ButtonGroup>
			{isTestOpen && (
				<ActionFieldTestButton
					actionName={actionName}
					configKey={configKey}
					value={value}
					pubId={context.type === "run" ? context.pubId : undefined}
					contextType={
						context.type === "run"
							? "run"
							: (context.type as Exclude<ActionFormContextContextValue, "run">)
					}
					actionAccepts={action.accepts}
				/>
			)}
		</>
	);
}

export function ActionFieldTestButton(props: {
	actionName: ActionEnum;
	configKey: string;
	value: string;
	pubId?: PubsId;
	contextType: ActionFormContextContextValue;
	actionAccepts: readonly string[];
}) {
	const [, setInputType] = useState<TestInputType>(() =>
		getDefaultTestInputType(props.contextType, props.pubId, props.actionAccepts)
	);
	const [selectedPubId, setSelectedPubId] = useState<string>(props.pubId ?? "");
	const [testValidation, setTestValidation] = useState(true);

	const [jsonBlob, setJsonBlob] = useState("{}");

	const community = useCommunity();

	const inputType = getDefaultTestInputType(props.contextType, props.pubId, props.actionAccepts);

	const getBodyForTest = () => {
		if (inputType === "current-pub" && props.pubId) {
			return { pubId: props.pubId };
		}
		if (inputType === "select-pub" && selectedPubId) {
			return { pubId: selectedPubId as PubsId };
		}
		if (inputType === "json-blob") {
			try {
				return { body: JSON.parse(jsonBlob) };
			} catch {
				return null;
			}
		}
		return null;
	};

	const {
		mutate: testInterpolate,
		isPending,
		data,
		reset,
	} = client.actions.test.interpolate.useMutation();

	const result = data?.body;
	const isSuccess = result?.success === true;
	const isError = result?.success === false;

	const canTest = () => {
		if (inputType === "current-pub") {
			return !!props.pubId;
		}
		if (inputType === "select-pub") {
			return !!selectedPubId;
		}
		if (inputType === "json-blob") {
			try {
				JSON.parse(jsonBlob);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	};

	const handleTest = () => {
		const body = getBodyForTest();
		if (!body) {
			return;
		}

		testInterpolate({
			params: {
				communitySlug: community.slug,
				actionName: props.actionName,
			},
			body: {
				key: props.configKey,
				value: props.value,
				validate: testValidation,
				...body,
			},
		});
	};

	const showInputSelector =
		props.contextType !== "run" ||
		(props.contextType === "run" && props.actionAccepts.includes("json"));

	const tabCount =
		(props.pubId && props.contextType === "run" ? 1 : 0) +
		1 +
		(props.actionAccepts.includes("json") ? 1 : 0);

	return (
		<div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
			{showInputSelector && (
				<div className="space-y-2">
					<Label className="text-xs text-gray-700">Test with</Label>
					<Tabs
						value={inputType}
						onValueChange={(v) => {
							setInputType(v as TestInputType);
							reset();
						}}
						className="w-full"
					>
						<TabsList
							className={cn(
								"grid w-full",
								tabCount === 1 && "grid-cols-1",
								tabCount === 2 && "grid-cols-2",
								tabCount === 3 && "grid-cols-3"
							)}
						>
							{props.pubId && props.contextType === "run" && (
								<TabsTrigger value="current-pub" className="text-xs">
									Current pub
								</TabsTrigger>
							)}
							<TabsTrigger value="select-pub" className="text-xs">
								Select pub
							</TabsTrigger>
							{props.actionAccepts.includes("json") && (
								<TabsTrigger value="json-blob" className="text-xs">
									JSON blob
								</TabsTrigger>
							)}
						</TabsList>
						<TabsContent value="current-pub" className="mt-2">
							<p className="text-xs text-gray-600">
								Test using the current pub context
							</p>
						</TabsContent>
						<TabsContent value="select-pub" className="mt-2 space-y-2">
							<Input
								type="text"
								placeholder="Enter pub ID"
								value={selectedPubId}
								onChange={(e) => setSelectedPubId(e.target.value)}
								className="text-xs"
							/>
						</TabsContent>
						<TabsContent value="json-blob" className="mt-2 space-y-2">
							<Textarea
								placeholder='{"key": "value"}'
								value={jsonBlob}
								onChange={(e) => setJsonBlob(e.target.value)}
								className="min-h-[100px] font-mono text-xs"
							/>
						</TabsContent>
					</Tabs>
				</div>
			)}

			<Button
				variant="outline"
				size="sm"
				type="button"
				onClick={handleTest}
				disabled={!canTest() || isPending}
				className="w-full text-xs"
			>
				{isPending ? (
					<>
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						Testing...
					</>
				) : (
					"Run test"
				)}
			</Button>
			<Field orientation="horizontal">
				<FieldContent>
					<FieldLabel>Validate</FieldLabel>
				</FieldContent>
				<Switch checked={testValidation} onCheckedChange={setTestValidation} />
			</Field>

			{isSuccess && result.interpolated !== undefined && (
				<Alert className="border-green-200 bg-green-50">
					<CheckCircle2 className="h-4 w-4 text-green-600" />
					<AlertDescription className="ml-2">
						<div className="text-xs font-medium text-green-900">
							Interpolation successful
						</div>
						<pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-900">
							{JSON.stringify(result.interpolated, null, 2)}
						</pre>
					</AlertDescription>
				</Alert>
			)}

			{isError && result.error && (
				<Alert className="border-red-200 bg-red-50">
					<AlertCircle className="h-4 w-4 text-red-600" />
					<AlertDescription className="ml-2">
						<div className="text-xs font-medium text-red-900">
							{result.error.type === "jsonata_error" && "JSONata expression error"}
							{result.error.type === "parse_error" && "JSON parse error"}
							{result.error.type === "syntax_error" && "Syntax error"}
							{result.error.type === "validation_error" && "Validation error"}
							{result.error.type === "invalid_key" && "Invalid configuration"}
							{result.error.type === "unknown_error" && "Error"}
						</div>
						<div className="mt-1 text-xs text-red-800">{result.error.message}</div>
						{result.error.issues && result.error.issues.length > 0 && (
							<div className="mt-2 space-y-1">
								{result.error.issues.map((issue: any, idx: number) => (
									<div key={idx} className="text-xs text-red-700">
										{issue.path?.length > 0 && (
											<span className="font-medium">
												{issue.path.join(".")}:{" "}
											</span>
										)}
										{issue.message}
									</div>
								))}
							</div>
						)}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

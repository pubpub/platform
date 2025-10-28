import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { useEffect, useMemo, useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { AlertCircle, Braces, CheckCircle2, Loader2, TestTube, X } from "lucide-react";
import { z } from "zod";

import type { Action as ActionEnum, PubsId } from "db/public";
import { interpolate } from "@pubpub/json-interpolate";
import { Alert, AlertDescription } from "ui/alert";
import { Button } from "ui/button";
import { ButtonGroup } from "ui/button-group";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Textarea } from "ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";
import { tryCatch } from "utils/try-catch";

import type { ActionFormContextContext, ActionFormContextContextValue } from "./ActionFormProvider";
import { getActionByName } from "~/actions/api";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { client } from "~/lib/api";
import { createPubProxy } from "./pubProxy";
import { isJsonTemplate } from "./schemaWithJsonFields";

type TestInputType = "current-pub" | "select-pub" | "json-blob";

export type JsonState =
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

export function ActionFieldJsonInput(props: {
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
				<ActionFieldJsonTest
					actionName={actionName}
					configKey={configKey}
					value={field.value}
					pubId={context.type === "run" ? context.pubId : undefined}
					contextType={
						context.type === "run"
							? "run"
							: (context.type as Exclude<ActionFormContextContextValue, "run">)
					}
					actionAccepts={actionAccepts}
				/>
			)}
		</>
	);
}

export function ActionFieldJsonTest(props: {
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

	const action = getActionByName(props.actionName);
	const [selectedPubId, setSelectedPubId] = useState<string>(props.pubId ?? "");

	const [jsonBlob, setJsonBlob] = useState("{}");

	const community = useCommunity();

	const inputType = getDefaultTestInputType(props.contextType, props.pubId, props.actionAccepts);

	const [testResult, setTestResult] = useState<{
		status: "success" | "error" | "pending" | "ready" | "start" | "unknown";
		interpolated?: unknown;
		error?: {
			type: string;
			message: string;
			issues?: z.ZodIssue[];
		};
	}>({ status: "start" });

	const { data, isPending, isSuccess, isError } = client.pubs.get.useQuery({
		queryData: selectedPubId
			? {
					params: {
						communitySlug: community.slug,
						pubId: selectedPubId,
					},
					query: {
						depth: 3,
						withRelatedPubs: true,
						withPubType: true,
						withStage: true,
					},
				}
			: skipToken,
		initialData: undefined,
		queryKey: ["pub", props.pubId],
	});

	useEffect(() => {
		if (testResult.status === "start" && isSuccess) {
			setTestResult({ status: "ready" });
		}
	}, [isSuccess]);

	const bodyForTest = useMemo(() => {
		if (inputType === "current-pub" && selectedPubId && data?.body) {
			return createPubProxy(data.body, community.slug);
		}
		if (inputType === "select-pub" && selectedPubId && data?.body) {
			return createPubProxy(data.body, community.slug);
		}
		if (inputType === "json-blob") {
			try {
				return { body: JSON.parse(jsonBlob) };
			} catch {
				return null;
			}
		}
		return null;
	}, [inputType, props.pubId, selectedPubId, jsonBlob, data?.body, community.slug]);

	const result = data?.body;

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

	const handleTest = async () => {
		if (!bodyForTest) {
			setTestResult({
				status: "error",
				error: {
					type: "unknown_error" as const,
					message: "No body to test",
				},
			});
			return;
		}

		const configShape = action.config.schema.shape as Record<string, z.ZodType<any>>;

		if (!(props.configKey in configShape)) {
			setTestResult({
				status: "error",
				error: {
					type: "invalid_key" as const,
					message: `Key ${props.configKey} not found in action ${props.actionName}`,
				},
			});
			return;
		}

		try {
			const [interpolateError, interpolated] = await tryCatch(
				interpolate(props.value, bodyForTest)
			);

			if (interpolateError) {
				let errorType: "jsonata_error" | "parse_error" | "syntax_error" | "unknown_error" =
					"unknown_error";
				if (interpolateError?.message.includes("expression")) {
					errorType = "jsonata_error";
				} else if (
					interpolateError?.message.includes("parse") ||
					interpolateError?.message.includes("JSON")
				) {
					errorType = "parse_error";
				} else if (interpolateError?.message.includes("unclosed interpolation")) {
					errorType = "syntax_error";
				}

				setTestResult({
					status: "error",
					error: {
						type: errorType,
						message: interpolateError.message,
					},
				});
				return;
			}

			const parsedBody = configShape[props.configKey].safeParse(interpolated);
			if (!parsedBody.success) {
				setTestResult({
					status: "error",
					interpolated,
					error: {
						type: "validation_error" as const,
						message:
							"Interpolated correctly, but interpolated value does not match the expected type for this field",
						issues: parsedBody.error.issues,
					},
				});
				return;
			}

			setTestResult({
				status: "success",
				interpolated: parsedBody.data,
			});
		} catch (error) {
			setTestResult({
				status: "error",
				error: {
					type: "unknown_error" as const,
					message: error instanceof Error ? error.message : String(error),
				},
			});
			return;
		}
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
				onClick={async () => {
					setTestResult({ status: "pending" });
					await handleTest();
				}}
				disabled={!canTest() || isPending}
				className="w-full text-xs"
			>
				{testResult.status === "pending" ? (
					<>
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						Testing...
					</>
				) : testResult.status === "start" && isPending ? (
					<>
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						Fetching pub...
					</>
				) : (
					"Evaluate"
				)}
			</Button>

			{testResult.status === "success" && testResult.interpolated !== undefined && (
				<Alert className="border-green-200 bg-green-50">
					<CheckCircle2 className="h-4 w-4 text-green-600" />
					<AlertDescription className="ml-2">
						<div className="text-xs font-medium text-green-900">
							Interpolation successful
						</div>
						<pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-900">
							{JSON.stringify(testResult.interpolated, null, 2)}
						</pre>
					</AlertDescription>
				</Alert>
			)}

			{testResult.status === "error" && testResult.error !== undefined && (
				<Alert className="border-red-200 bg-red-50">
					<AlertCircle className="h-4 w-4 text-red-600" />
					<AlertDescription className="ml-2">
						<div className="text-xs font-medium text-red-900">
							{testResult.error.type === "jsonata_error" &&
								"JSONata expression error"}
							{testResult.error.type === "parse_error" && "JSON parse error"}
							{testResult.error.type === "syntax_error" && "Syntax error"}
							{testResult.error.type === "validation_error" && "Validation error"}
							{testResult.error.type === "invalid_key" && "Invalid configuration"}
							{testResult.error.type === "unknown_error" && "Error"}
						</div>
						<div className="mt-1 text-xs text-red-800">{testResult.error.message}</div>
						{testResult.interpolated && (
							<pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-900">
								{JSON.stringify(testResult.interpolated, null, 2)}
							</pre>
						)}
						{testResult.error.issues && testResult.error.issues.length > 0 && (
							<div className="mt-2 space-y-1">
								{testResult.error.issues.map((issue: any, idx: number) => (
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

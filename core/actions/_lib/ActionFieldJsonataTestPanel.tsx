import type z from "zod";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, Zap, ZapOff } from "lucide-react";

import { interpolate } from "@pubpub/json-interpolate";
import { Action as ActionEnum, PubsId } from "db/public";
import { Alert, AlertDescription } from "ui/alert";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Textarea } from "ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";
import { tryCatch } from "utils/try-catch";

import type { ActionFormContextContextValue } from "./ActionFormProvider";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { client } from "~/lib/api";
import { getActionByName } from "../api";
import { createPubProxy } from "./pubProxy";

export type TestInputType = "current-pub" | "select-pub" | "json-blob";

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

export function ActionFieldJsonataTestPanel(props: {
	actionName: ActionEnum;
	configKey: string;
	value: string;
	pubId?: PubsId;
	contextType: ActionFormContextContextValue;
	actionAccepts: readonly string[];
	mode?: "template" | "jsonata";
}) {
	const [inputType, setInputType] = useState<TestInputType>(() =>
		getDefaultTestInputType(props.contextType, props.pubId, props.actionAccepts)
	);

	const action = getActionByName(props.actionName);
	const [selectedPubId, setSelectedPubId] = useState<string>(props.pubId ?? "");
	const [jsonBlob, setJsonBlob] = useState("{}");
	const [autoEvaluate, setAutoEvaluate] = useState(true);

	const community = useCommunity();

	const [testResult, setTestResult] = useState<{
		status: "success" | "error" | "pending" | "ready" | "start" | "idle";
		interpolated?: unknown;
		error?: {
			type: string;
			message: string;
			issues?: z.ZodIssue[];
		};
	}>({ status: "idle" });

	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const { data, isPending } = client.pubs.get.useQuery({
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

	// cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

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

	const handleTest = useCallback(async () => {
		if (!bodyForTest) {
			setTestResult({
				status: "error",
				error: {
					type: "unknown_error" as const,
					message: "No data available to test",
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

		setTestResult({ status: "pending" });

		try {
			const mode = props.mode ?? "jsonata";
			const [interpolateError, interpolated] = await tryCatch(
				interpolate(props.value, bodyForTest, mode)
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
		}
	}, [
		bodyForTest,
		action.config.schema,
		props.configKey,
		props.actionName,
		props.value,
		props.mode,
	]);

	// auto-evaluate with debouncing
	useEffect(() => {
		if (!autoEvaluate) {
			return;
		}

		if (!canTest()) {
			setTestResult({ status: "idle" });
			return;
		}

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			handleTest();
		}, 500);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [autoEvaluate, props.value, bodyForTest, canTest, handleTest]);

	const showInputSelector =
		props.contextType !== "run" ||
		(props.contextType === "run" && props.actionAccepts.includes("json"));

	const tabCount =
		(props.pubId && props.contextType === "run" ? 1 : 0) +
		1 +
		(props.actionAccepts.includes("json") ? 1 : 0);

	return (
		<div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2 transition-all duration-200">
			<div className="flex items-center justify-between">
				<Label className="text-xs font-medium text-gray-700">Test result</Label>
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setAutoEvaluate(!autoEvaluate)}
							className={cn(
								"h-7 gap-1.5 px-2 text-xs transition-colors",
								autoEvaluate
									? "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							)}
						>
							{autoEvaluate ? <Zap size={12} /> : <ZapOff size={12} />}
							Auto
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{autoEvaluate ? "Auto-evaluation enabled" : "Auto-evaluation disabled"}
					</TooltipContent>
				</Tooltip>
			</div>

			{showInputSelector && (
				<div className="space-y-2">
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

			{!autoEvaluate && (
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={handleTest}
					disabled={!canTest() || isPending || testResult.status === "pending"}
					className="w-full text-xs"
				>
					{testResult.status === "pending" ? (
						<>
							<Loader2 className="mr-2 h-3 w-3 animate-spin" />
							Evaluating...
						</>
					) : isPending ? (
						<>
							<Loader2 className="mr-2 h-3 w-3 animate-spin" />
							Loading data...
						</>
					) : (
						"Evaluate"
					)}
				</Button>
			)}

			<div className="min-h-[60px] transition-all duration-200">
				{testResult.status === "pending" && (
					<div className="flex items-center justify-center py-4 text-xs text-gray-500">
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						Evaluating...
					</div>
				)}

				{testResult.status === "idle" && (
					<div className="flex items-center justify-center py-4 text-xs text-gray-400">
						{!canTest() ? "Enter test data to see results" : "Waiting for input..."}
					</div>
				)}

				{testResult.status === "success" && testResult.interpolated !== undefined && (
					<Alert className="border-green-200 bg-green-50 duration-200 animate-in fade-in-50">
						<CheckCircle2 className="h-4 w-4 text-green-600" />
						<AlertDescription className="ml-2">
							<div className="text-xs font-medium text-green-900">Success</div>
							<pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-900">
								{JSON.stringify(testResult.interpolated, null, 2)}
							</pre>
						</AlertDescription>
					</Alert>
				)}

				{testResult.status === "error" && testResult.error !== undefined && (
					<Alert className="border-red-200 bg-red-50 duration-200 animate-in fade-in-50">
						<AlertCircle className="h-4 w-4 text-red-600" />
						<AlertDescription className="ml-2">
							<div className="text-xs font-medium text-red-900">
								{testResult.error.type === "jsonata_error" && "JSONata Error"}
								{testResult.error.type === "parse_error" && "Parse Error"}
								{testResult.error.type === "syntax_error" && "Syntax Error"}
								{testResult.error.type === "validation_error" && "Validation Error"}
								{testResult.error.type === "invalid_key" && "Configuration Error"}
								{testResult.error.type === "unknown_error" && "Error"}
							</div>
							<div className="mt-1 text-xs text-red-800">
								{testResult.error.message}
							</div>
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
		</div>
	);
}

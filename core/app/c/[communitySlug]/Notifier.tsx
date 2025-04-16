"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useSSE } from "use-next-sse";

import type { ActionInstancesId, ActionRunsId } from "db/public";
import { toast } from "ui/use-toast";

import type { ActionRunNotification } from "~/app/api/v0/c/[communitySlug]/sse/route";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";

// types for our context and hooks
export type ActionRunUpdate = ActionRunNotification & {
	timestamp: number;
};

type ActionRunNotifierContext = {
	updates: ActionRunUpdate[];
};

// create context with a default value
const ActionRunNotifierContext = createContext<ActionRunNotifierContext>({
	updates: [],
});

// custom hooks for consuming the notifications
export const useActionRunUpdates = (actionRunId: ActionRunsId) => {
	const { updates } = useContext(ActionRunNotifierContext);

	return useMemo(
		() =>
			updates
				.filter((update) => update.id === actionRunId)
				.sort((a, b) => b.timestamp - a.timestamp),
		[updates, actionRunId]
	);
};

export const useActionInstanceUpdates = (actionInstanceId: ActionInstancesId) => {
	const { updates } = useContext(ActionRunNotifierContext);

	return updates
		.filter((update) => update.actionInstanceId === actionInstanceId)
		.sort((a, b) => b.timestamp - a.timestamp);
};

// helper to format notification messages
const formatNotificationMessage = (notification: ActionRunNotification) => {
	const statusText = {
		success: "completed successfully",
		failure: "failed",
		scheduled: "scheduled",
	}[notification.status];

	return `Action run ${statusText}`;
};

type ActionRunNotifierProps = {
	children: React.ReactNode;
	// maximum number of updates to keep in memory
	maxUpdates?: number;
};

const _ActionRunNotifierProvider = ({ children, maxUpdates = 100 }: ActionRunNotifierProps) => {
	const { communitySlug } = useParams();
	const { data, error } = useSSE<ActionRunNotification>({
		url: `/api/v0/c/${communitySlug}/sse`,
		eventName: "action_run_update",
		withCredentials: true,
		reconnect: {
			interval: 1_000,
			maxAttempts: 5,
		},
	});

	const [contextValue, setContextValue] = useState<ActionRunUpdate[]>([]);

	const isFirstUpdate = useRef(true);

	useEffect(() => {
		if (isFirstUpdate.current) {
			isFirstUpdate.current = false;
			return;
		}

		if (error) {
			console.error("error", error);
			// toast({
			// 	variant: "destructive",
			// 	title: "Notification Error",
			// 	description: error.message,
			// });
			return;
		}

		if (data) {
			setContextValue((old) =>
				[{ ...data, timestamp: Date.now() }, ...old].slice(0, maxUpdates)
			);

			console.log("data", data);
			// toast({
			// 	variant:
			// 		data.status === "success"
			// 			? "success"
			// 			: data.status === "failure"
			// 				? "destructive"
			// 				: "default",
			// 	title: "Action Update",
			// 	description: formatNotificationMessage(data),
			// });
		}
	}, [data, error]);

	return (
		<ActionRunNotifierContext.Provider value={{ updates: contextValue }}>
			{children}
		</ActionRunNotifierContext.Provider>
	);
};

export const DynamicActionRunNotifierProvider = ({
	children,
	maxUpdates = 100,
}: ActionRunNotifierProps) => {
	return (
		<ActionRunNotifierProvider maxUpdates={maxUpdates}>{children}</ActionRunNotifierProvider>
	);
};

export const ActionRunNotifierProvider = dynamic(
	() => Promise.resolve(_ActionRunNotifierProvider),
	{
		ssr: false,
		loading: () => <SkeletonCard />,
	}
);

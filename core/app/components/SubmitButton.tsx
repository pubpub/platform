import type { MutationStatus } from "@tanstack/react-query";
import type { FormState } from "react-hook-form";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { cn } from "utils";

type Status = MutationStatus;

type SubmitButtonProps = {
	// customization
	idleText?: React.ReactNode;
	pendingText?: React.ReactNode;
	successText?: React.ReactNode;
	errorText?: React.ReactNode;

	"data-testid"?: string;

	// button props
	className?: string;
	type?: "button" | "submit" | "reset";
} & (
	| {
			state: Status;
			// direct control props
			isSubmitting?: never;
			isSubmitSuccessful?: never;
			isSubmitError?: never;
	  }
	| {
			/**
			 * cannot be used together with direct control props
			 */
			state?: never;
			// direct control props
			isSubmitting?: boolean;
			isSubmitSuccessful?: boolean;
			isSubmitError?: boolean;
	  }
);

export const SubmitButton = ({
	state,
	isSubmitting,
	isSubmitSuccessful,
	isSubmitError,
	idleText = "Submit",
	pendingText = "Submitting...",
	successText = "Success!",
	errorText = "Error",
	className = "",
	onClick,
	type = "submit",
	...props
}: ButtonProps & SubmitButtonProps) => {
	const [buttonState, setButtonState] = useState<Status>("idle");
	const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

	const setErrorState = useCallback(() => {
		setButtonState("error");
		if (errorTimeout) clearTimeout(errorTimeout);
		const timeout = setTimeout(() => setButtonState("idle"), 2000);
		setErrorTimeout(timeout);
	}, [errorTimeout]);

	useEffect(() => {
		// determine state based on props
		if (state) {
			setButtonState(state);
			if (state === "error") {
				setErrorState();
			}
			return;
		}

		if (isSubmitting) {
			setButtonState("pending");
		} else if (isSubmitSuccessful) {
			setButtonState("success");
		} else if (isSubmitError) {
			setErrorState();
		}

		setButtonState("idle");
		return;
	}, [state, isSubmitting, isSubmitSuccessful, isSubmitError]);

	// clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (errorTimeout) clearTimeout(errorTimeout);
		};
	}, [errorTimeout]);

	const getButtonText = () => {
		switch (buttonState) {
			case "pending":
				return pendingText;
			case "success":
				return successText;
			case "error":
				return errorText;
			default:
				return idleText;
		}
	};

	const getButtonVariant = () => {
		return buttonState === "error" ? "destructive" : "default";
	};

	const getButtonIcon = () => {
		switch (buttonState) {
			case "pending":
				return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
			case "success":
				return <CheckCircle className="mr-2 h-4 w-4" />;
			case "error":
				return <XCircle className="mr-2 h-4 w-4" />;
			default:
				return null;
		}
	};

	return (
		<Button
			type={type}
			className={cn(className, "transition-colors duration-500")}
			onClick={onClick}
			variant={getButtonVariant()}
			disabled={buttonState === "pending"}
			{...props}
		>
			{getButtonIcon()}
			{getButtonText()}
		</Button>
	);
};

export const FormSubmitButton = ({
	formState,
	...props
}: ButtonProps & Omit<SubmitButtonProps, "state"> & { formState: FormState<any> }) => {
	return (
		<SubmitButton
			isSubmitting={Boolean(formState.isSubmitting)}
			isSubmitSuccessful={Boolean(formState.isSubmitSuccessful)}
			isSubmitError={Boolean(Object.keys(formState.errors ?? {}).length > 0)}
			{...props}
		/>
	);
};

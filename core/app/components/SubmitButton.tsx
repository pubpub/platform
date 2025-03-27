import type { FormState } from "react-hook-form";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "ui/button";
import { cn } from "utils";

type ButtonState = "idle" | "loading" | "success" | "error";

type SubmitButtonProps = {
	// direct control props
	state?: ButtonState;
	isSubmitting?: boolean;
	isSubmitSuccessful?: boolean;
	isSubmitError?: boolean;

	// form integration
	formState?: FormState<any>;

	// customization
	idleText?: string;
	loadingText?: string;
	successText?: string;
	errorText?: string;

	// button props
	className?: string;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
};

export const SubmitButton = ({
	state,
	isSubmitting,
	isSubmitSuccessful,
	isSubmitError,
	formState,
	idleText = "Submit",
	loadingText = "Submitting...",
	successText = "Success!",
	errorText = "Error",
	className = "",
	onClick,
	type = "submit",
}: SubmitButtonProps) => {
	const [buttonState, setButtonState] = useState<ButtonState>("idle");
	const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// determine state based on props
		if (state) {
			setButtonState(state);
			return;
		}

		if (formState) {
			if (formState.isSubmitting) {
				setButtonState("loading");
				return;
			}

			if (formState.isSubmitSuccessful) {
				setButtonState("success");
				return;
			}

			if (formState.errors && Object.keys(formState.errors).length > 0) {
				setButtonState("error");

				// reset error state after 2 seconds
				if (errorTimeout) clearTimeout(errorTimeout);
				const timeout = setTimeout(() => setButtonState("idle"), 2000);
				setErrorTimeout(timeout);
				return;
			}

			setButtonState("idle");
			return;
		}

		// direct prop control
		if (isSubmitting) {
			setButtonState("loading");
		} else if (isSubmitError) {
			setButtonState("error");

			// reset error state after 2 seconds
			if (errorTimeout) clearTimeout(errorTimeout);
			const timeout = setTimeout(() => setButtonState("idle"), 2000);
			setErrorTimeout(timeout);
		} else if (isSubmitSuccessful) {
			setButtonState("success");
		} else {
			setButtonState("idle");
		}
	}, [state, formState, isSubmitting, isSubmitSuccessful, isSubmitError]);

	// clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (errorTimeout) clearTimeout(errorTimeout);
		};
	}, [errorTimeout]);

	const getButtonText = () => {
		switch (buttonState) {
			case "loading":
				return loadingText;
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
			case "loading":
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
			disabled={buttonState === "loading"}
		>
			{getButtonIcon()}
			{getButtonText()}
		</Button>
	);
};

/**
 * Form submit button that automatically handles loading state
 */
export const FormSubmitButton = ({
	formState,
	idleText = "Submit",
	loadingText = "Submitting...",
	successText = "Success!",
	errorText = "Error",
	className = "",
}: {
	formState: FormState<any>;
	/**
	 * Default text.
	 *
	 * @default "Submit"
	 */
	idleText?: string;
	loadingText?: string;
	successText?: string;
	errorText?: string;
	className?: string;
}) => {
	return (
		<SubmitButton
			formState={formState}
			idleText={idleText}
			loadingText={loadingText}
			successText={successText}
			errorText={errorText}
			className={className}
		/>
	);
};

import type { FormState } from "react-hook-form"
import type { ButtonProps } from "ui/button"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle, ChevronDown, Loader2, XCircle } from "lucide-react"

import { Button } from "ui/button"
import { ButtonGroup } from "ui/button-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { cn } from "utils"

// state

export type ButtonState = "idle" | "pending" | "success" | "error"

type UseSubmitButtonStateProps =
	| {
			state: ButtonState
			isSubmitting?: never
			isSubmitSuccessful?: never
			isSubmitError?: never
	  }
	| {
			state?: never
			isSubmitting?: boolean
			isSubmitSuccessful?: boolean
			isSubmitError?: boolean
	  }

function useSubmitButtonState(props: UseSubmitButtonStateProps) {
	const { state, isSubmitting, isSubmitSuccessful, isSubmitError } = props
	const [buttonState, setButtonState] = useState<ButtonState>("idle")
	const errorTimeoutRef = useRef<number | null>(null)

	const setErrorState = useCallback(() => {
		setButtonState("error")
		if (errorTimeoutRef.current) {
			clearTimeout(errorTimeoutRef.current)
		}
		const timeout = setTimeout(() => setButtonState("idle"), 2000)
		errorTimeoutRef.current = timeout as unknown as number
	}, [])

	useEffect(() => {
		if (state) {
			if (state === "error") {
				setErrorState()
			} else {
				setButtonState(state)
			}
			return
		}

		if (isSubmitting) {
			setButtonState("pending")
		} else if (isSubmitSuccessful) {
			setButtonState("success")
		} else if (isSubmitError) {
			setErrorState()
		} else {
			setButtonState("idle")
		}
	}, [state, isSubmitting, isSubmitSuccessful, isSubmitError, setErrorState])

	useEffect(() => {
		return () => {
			if (errorTimeoutRef.current) {
				clearTimeout(errorTimeoutRef.current)
			}
		}
	}, [])

	const variant: "destructive" | "default" = buttonState === "error" ? "destructive" : "default"
	const isDisabled = buttonState === "pending"

	return { buttonState, variant, isDisabled }
}

// helpers

function getButtonText(
	buttonState: ButtonState,
	texts: {
		idle: React.ReactNode
		pending: React.ReactNode
		success: React.ReactNode
		error: React.ReactNode
	}
) {
	switch (buttonState) {
		case "pending":
			return texts.pending
		case "success":
			return texts.success
		case "error":
			return texts.error
		default:
			return texts.idle
	}
}

function getButtonIcon(buttonState: ButtonState) {
	switch (buttonState) {
		case "pending":
			return <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		case "success":
			return <CheckCircle className="mr-2 h-4 w-4" />
		case "error":
			return <XCircle className="mr-2 h-4 w-4" />
		default:
			return null
	}
}

// types

export type DropdownOption = {
	label: string
	onSelect: () => void
}

type SubmitButtonTextProps = {
	idleText?: React.ReactNode
	pendingText?: React.ReactNode
	successText?: React.ReactNode
	errorText?: React.ReactNode
}

type BaseSubmitButtonProps = ButtonProps &
	SubmitButtonTextProps & {
		"data-testid"?: string
		className?: string
		type?: "button" | "submit" | "reset"
	}

// submit button

type SubmitButtonProps = BaseSubmitButtonProps & UseSubmitButtonStateProps

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
}: SubmitButtonProps) => {
	const { buttonState, variant, isDisabled } = useSubmitButtonState({
		state,
		isSubmitting,
		isSubmitSuccessful,
		isSubmitError,
	} as UseSubmitButtonStateProps)

	return (
		<Button
			type={type}
			className={cn(className, "transition-colors duration-500")}
			onClick={onClick}
			variant={variant}
			disabled={isDisabled}
			{...props}
		>
			{getButtonIcon(buttonState)}
			{getButtonText(buttonState, {
				idle: idleText,
				pending: pendingText,
				success: successText,
				error: errorText,
			})}
		</Button>
	)
}

// submit button with dropdown

type SubmitButtonWithDropdownProps = BaseSubmitButtonProps &
	UseSubmitButtonStateProps & {
		dropdownOptions: DropdownOption[]
	}

export const SubmitButtonWithDropdown = ({
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
	dropdownOptions,
	...props
}: SubmitButtonWithDropdownProps) => {
	const { buttonState, variant, isDisabled } = useSubmitButtonState({
		state,
		isSubmitting,
		isSubmitSuccessful,
		isSubmitError,
	} as UseSubmitButtonStateProps)

	return (
		<ButtonGroup>
			<Button
				type={type}
				className={cn(className, "transition-colors duration-500")}
				onClick={onClick}
				variant={variant}
				disabled={isDisabled}
				{...props}
			>
				{getButtonIcon(buttonState)}
				{getButtonText(buttonState, {
					idle: idleText,
					pending: pendingText,
					success: successText,
					error: errorText,
				})}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						className="px-2 transition-colors duration-500"
						variant={variant}
						disabled={isDisabled}
					>
						<ChevronDown className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{dropdownOptions.map((option) => (
						<DropdownMenuItem key={option.label} onSelect={option.onSelect}>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	)
}

// form submit button

type FormSubmitButtonProps = BaseSubmitButtonProps & {
	formState: FormState<any>
}

export const FormSubmitButton = ({
	formState,
	idleText = "Submit",
	pendingText = "Submitting...",
	successText = "Success!",
	errorText = "Error",
	className = "",
	onClick,
	type = "submit",
	...props
}: FormSubmitButtonProps) => {
	const hasErrors = Object.keys(formState.errors ?? {}).length > 0
	const isSubmitting = Boolean(formState.isSubmitting)
	const isSubmitSuccessful = Boolean(formState.isSubmitSuccessful) && !hasErrors

	const { buttonState, variant, isDisabled } = useSubmitButtonState({
		isSubmitting,
		isSubmitSuccessful,
		isSubmitError: hasErrors,
	})

	return (
		<Button
			type={type}
			className={cn(className, "transition-colors duration-500")}
			onClick={onClick}
			variant={variant}
			disabled={isDisabled}
			{...props}
		>
			{getButtonIcon(buttonState)}
			{getButtonText(buttonState, {
				idle: idleText,
				pending: pendingText,
				success: successText,
				error: errorText,
			})}
		</Button>
	)
}

// form submit button with dropdown

type FormSubmitButtonWithDropdownProps = BaseSubmitButtonProps & {
	formState: FormState<any>
	dropdownOptions: DropdownOption[]
}

export const FormSubmitButtonWithDropdown = ({
	formState,
	dropdownOptions,
	idleText = "Submit",
	pendingText = "Submitting...",
	successText = "Success!",
	errorText = "Error",
	className = "",
	onClick,
	type = "submit",
	...props
}: FormSubmitButtonWithDropdownProps) => {
	const hasErrors = Object.keys(formState.errors ?? {}).length > 0
	const isSubmitting = Boolean(formState.isSubmitting)
	const isSubmitSuccessful = Boolean(formState.isSubmitSuccessful) && !hasErrors

	const { buttonState, variant, isDisabled } = useSubmitButtonState({
		isSubmitting,
		isSubmitSuccessful,
		isSubmitError: hasErrors,
	})

	return (
		<ButtonGroup>
			<Button
				type={type}
				className={cn(className, "transition-colors duration-500")}
				onClick={onClick}
				variant={variant}
				disabled={isDisabled}
				{...props}
			>
				{getButtonIcon(buttonState)}
				{getButtonText(buttonState, {
					idle: idleText,
					pending: pendingText,
					success: successText,
					error: errorText,
				})}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						className="px-2 transition-colors duration-500"
						variant={variant}
						disabled={isDisabled}
					>
						<ChevronDown className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{dropdownOptions.map((option) => (
						<DropdownMenuItem key={option.label} onSelect={option.onSelect}>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	)
}

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "ui/button";
import { FormLabel } from "ui/form";
import { FormInput, Pencil } from "ui/icon";

import { DEFAULT_BUTTON } from "./ButtonConfigurationForm";
import { useFormBuilder } from "./FormBuilderContext";
import { isButtonElement } from "./types";

const ButtonOption = ({
	label,
	buttonType,
	id,
}: {
	label: string;
	buttonType: string;
	id?: string;
}) => {
	const { openButtonConfigPanel } = useFormBuilder();
	const handleClick = () => {
		openButtonConfigPanel(id);
	};
	return (
		// overflow-hidden to keep the div that is only a color inside the border radius
		<div className="relative flex items-center justify-between overflow-hidden rounded border">
			<div className="absolute h-full w-4 bg-foreground"></div>
			<div className="ml-7 flex items-center gap-3">
				<FormInput width="20px" />
				<div className="flex h-full flex-col py-3">
					<span className="text-sm font-medium text-muted-foreground">{buttonType}</span>
					<span className="font-semibold">{label}</span>
				</div>
			</div>
			<Button onClick={handleClick} variant="ghost" className="mr-2 p-2">
				<span className="sr-only">Edit</span>
				<Pencil className="text-neutral-500" />
			</Button>
		</div>
	);
};

const DefaultButton = () => {
	return <ButtonOption label={DEFAULT_BUTTON.label} buttonType={DEFAULT_BUTTON.buttonType} />;
};

export const SubmissionSettings = () => {
	// This uses the parent's form context to get the most up to date version of 'elements'
	const { getValues } = useFormContext();
	const buttons = useMemo(() => {
		const elements = getValues()["elements"];
		return elements.filter((e) => isButtonElement(e));
	}, []);
	const showDefaultButton = buttons.length === 0;

	return (
		<div>
			<FormLabel className="text-sm uppercase text-slate-500">Submission Settings</FormLabel>
			<hr className="my-2" />
			{showDefaultButton ? <DefaultButton /> : null}
			<div>
				{buttons.map((b, i) => {
					const buttonType = i === 0 ? "Primary Button" : "Secondary Button";
					return (
						<ButtonOption
							id={b.elementId}
							key={b.elementId}
							label={b.label}
							buttonType={buttonType}
						/>
					);
				})}
			</div>
		</div>
	);
};

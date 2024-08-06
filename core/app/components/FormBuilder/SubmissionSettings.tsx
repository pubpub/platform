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
	const { elements } = useFormBuilder();
	const buttons = elements.filter((e) => isButtonElement(e));
	const showDefaultButton = buttons.length === 0;

	return (
		<div>
			<FormLabel className="text-sm uppercase text-slate-500">Submission Settings</FormLabel>
			<hr className="my-2" />
			<div>{showDefaultButton ? <DefaultButton /> : null}</div>
		</div>
	);
};

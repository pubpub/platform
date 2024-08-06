import type { FormElements } from "db/public";
import { ElementType } from "db/public";
import { FormLabel } from "ui/form";
import { FormInput } from "ui/icon";

const ButtonOption = ({ label, buttonType }: { label: string; buttonType: string }) => {
	return (
		// overflow-hidden to keep the div that is only a color inside the border radius
		<div className="flex h-[57px] items-center gap-3 overflow-hidden rounded border">
			<div className="h-full w-4 bg-foreground"></div>
			<FormInput width="20px" />
			<div className="flex flex-col py-3">
				<span className="text-sm font-medium text-muted-foreground">{buttonType}</span>
				<span className="font-semibold">{label}</span>
			</div>
		</div>
	);
};

const DefaultButton = () => {
	return <ButtonOption label="Submit" buttonType="Primary Button" />;
};

export const SubmissionSettings = ({ elements }: { elements: FormElements[] }) => {
	const buttons = elements.filter((e) => e.type === ElementType.button);
	const showDefaultButton = buttons.length === 0;

	return (
		<div>
			<FormLabel className="text-sm uppercase text-slate-500">Submission Settings</FormLabel>
			<hr className="my-2" />
			<div>{showDefaultButton ? <DefaultButton /> : null}</div>
		</div>
	);
};

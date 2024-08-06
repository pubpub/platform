import { useFormBuilder } from "./FormBuilderContext";

export const DEFAULT_BUTTON = {
	label: "Submit",
	content: "Thank you for your submission",
	buttonType: "Primary Button",
};

export const ButtonConfigurationForm = ({ id }: { id: string | null }) => {
	const { elements } = useFormBuilder();
	const button = elements.find((e) => e.id === id);

	return <div>todo {id}</div>;
};

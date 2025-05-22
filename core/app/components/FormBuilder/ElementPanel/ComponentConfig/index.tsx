"use client";

import type React from "react";

import dynamic from "next/dynamic";

import { InputComponent } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { ComponentConfigFormProps } from "./types.ts";

const toDynamic = (path: string) =>
	// this dynamic import path needs to provide enough information for webpack/turbopack
	// to be able to find it. The relative path and the extension are enough, but something like
	// `import(path)` will not work.
	dynamic(() => import(`./${path}.tsx`), {
		ssr: false,
		loading: () => <Skeleton className="h-full w-full" />,
	});

const InputComponentMap = {
	[InputComponent.checkbox]: toDynamic("Checkbox"),
	[InputComponent.checkboxGroup]: toDynamic("CheckboxGroup"),
	[InputComponent.confidenceInterval]: toDynamic("ConfidenceInterval"),
	[InputComponent.datePicker]: toDynamic("DatePicker"),
	[InputComponent.fileUpload]: toDynamic("FileUpload"),
	[InputComponent.memberSelect]: toDynamic("MemberSelect"),
	[InputComponent.multivalueInput]: toDynamic("MultivalueInput"),
	[InputComponent.radioGroup]: toDynamic("RadioGroup"),
	[InputComponent.selectDropdown]: toDynamic("SelectDropdown"),
	[InputComponent.textArea]: toDynamic("TextArea"),
	[InputComponent.textInput]: toDynamic("TextInput"),
	[InputComponent.richText]: toDynamic("RichText"),
	[InputComponent.relationBlock]: toDynamic("RelationBlock"),
	[InputComponent.colorPicker]: toDynamic("ColorPicker"),
} satisfies Record<InputComponent, React.ComponentType>;

export const ComponentConfig = <I extends InputComponent>(props: ComponentConfigFormProps<I>) => {
	// ideally the compenent would be selected through some (generic) function, but for `dynamic`
	// to work properly the components need to be defined already outside of the react tree,
	// hence the map and the type cast
	const ConfigComponent = InputComponentMap[props.component] as React.FC<
		ComponentConfigFormProps<I>
	>;

	// This is the CoreSchemaType.Null case
	if (!ConfigComponent) {
		return null;
	}

	return <ConfigComponent {...props} />;
};

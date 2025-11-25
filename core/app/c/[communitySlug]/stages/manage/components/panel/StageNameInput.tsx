"use client";

import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Input } from "ui/input";
import { Label } from "ui/label";

type Props = {
	value: string;
	onChange: (value: string) => void;
};

export const StageNameInput = (props: Props) => {
	const [value, setValue] = useState(props.value);
	const onChangeDebounced = useDebouncedCallback(props.onChange, 500);
	const onChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const name = event.target.value;
			setValue(name);
			onChangeDebounced(name);
		},
		[onChangeDebounced]
	);

	return (
		<Label htmlFor="stage-name">
			<h4 className="mb-2 text-base font-medium">Stage Name</h4>
			<Input
				className="font-normal"
				id="stage-name"
				value={value}
				onChange={onChange}
				placeholder="Stage Name"
			/>
		</Label>
	);
};

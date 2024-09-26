// Adapted from https://gist.github.com/enesien/03ba5340f628c6c812b306da5fedd1a4

import type { Dispatch, SetStateAction } from "react";

import React, { forwardRef, useState } from "react";

import type { InputProps } from "./input";
import { Badge } from "./badge";
import { Button } from "./button";
import { GripVertical, XCircle } from "./icon";
import { Input } from "./input";

type MultiValueInputProps = Omit<InputProps, "onChange"> & {
	values: string[];
	onChange: Dispatch<SetStateAction<string[]>>;
};

export const MultiValueInput = forwardRef<HTMLInputElement, MultiValueInputProps>(
	({ values, onChange, ...props }, ref) => {
		const [pendingValue, setPendingValue] = useState("");

		const addPendingValue = () => {
			if (pendingValue) {
				const newValues = new Set([...values, pendingValue]);
				onChange(Array.from(newValues));
				setPendingValue("");
			}
		};

		return (
			<div className="flex flex-col gap-2">
				<Input
					value={pendingValue}
					onChange={(e) => setPendingValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addPendingValue();
						}
					}}
					placeholder="Type the value and hit enter"
					{...props}
					ref={ref}
				/>

				<div className="flex flex-wrap gap-x-2 gap-y-2">
					{values.map((value) => {
						return (
							<Badge key={value} className="bg-muted-foreground py-1">
								<Button variant="ghost" className="mr-1 h-5 px-0">
									<GripVertical size="12"></GripVertical>
								</Button>
								{value}
								<Button
									onClick={() => {
										onChange(values.filter((v) => v !== value));
									}}
									variant="ghost"
									className="ml-2 h-3 p-0"
								>
									<XCircle size="12"></XCircle>
								</Button>
							</Badge>
						);
					})}
				</div>
			</div>
		);
	}
);

MultiValueInput.displayName = "MultiValueInput";

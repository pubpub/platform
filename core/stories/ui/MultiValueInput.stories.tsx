/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { expect, fn, userEvent, within } from "storybook/test";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiValueInput } from "ui/multivalue-input";

const meta: Meta<typeof MultiValueInput> = {
	title: "MultiValueInput",
	component: MultiValueInput,
	tags: ["autodocs"],
	argTypes: {},
	args: { onChange: fn(), value: [] },
};
export default meta;

type Story = StoryObj<typeof MultiValueInput>;

export const Base: Story = {
	args: {},
};

export const WithValues: Story = {
	args: { value: ["cat", "dog"] },
};

export const ReplacedPlaceholder: Story = {
	args: { value: ["cat", "dog"], placeholder: "Add a value meow" },
};

export const Interactive: Story = {
	args: {},
	render: () => {
		const [values, setValues] = useState<string[]>([
			"cat",
			"dog",
			"squirrel",
			"alligator",
			"wolf",
			"otter",
			"seal",
			"mouse",
			"turtle",
			"lion",
			"tiger",
			"bobcat",
		]);
		return <MultiValueInput value={values} onChange={setValues} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Remove an element
		const bobcat = within(canvas.getByTestId("sortable-value-bobcat"));
		await userEvent.click(bobcat.getByTestId("remove-button"));
		expect(canvas.queryByTestId("sortable-value-bobcat")).not.toBeInTheDocument();

		// Add an element
		// NOTE: this test never seems to work the first time it renders inside storybook
		// but does succeed in subsequent runs
		const input = canvas.getByTestId("multivalue-input");
		await userEvent.type(input, "snake{enter}");
		await expect(canvas.getByTestId("sortable-value-snake")).toBeInTheDocument();
	},
};

export const FormUsage: Story = {
	render: () => {
		const schema = z.object({
			animals: z.string().array().min(1).max(2),
		});
		const form = useForm({
			defaultValues: { animals: [] },
			resolver: zodResolver(schema),
		});

		return (
			<Form {...form}>
				<form onSubmit={form.handleSubmit(fn())}>
					<FormField
						control={form.control}
						name="animals"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Favorite animals</FormLabel>
									<FormControl>
										<MultiValueInput {...field} />
									</FormControl>

									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<Button type="submit" className="mt-2">
						Submit
					</Button>
				</form>
			</Form>
		);
	},
};

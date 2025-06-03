import { describe } from "node:test";

import type { Static } from "@sinclair/typebox";
import type { ReactNode } from "react";

import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
import { checkboxGroupConfigSchema, MinMaxChoices } from "schemas";
import { getNumericArrayWithMinMax, getStringArrayWithMinMax } from "schemas/schemas";
import { expect, it, vi } from "vitest";

import { CoreSchemaType } from "db/public";
import { Form } from "ui/form";

import { CheckboxGroupElement } from "../forms/elements/CheckboxGroupElement";

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const FormWrapper = ({
	config,
	children,
	isStringArray,
	defaultValues,
}: {
	config: Static<typeof checkboxGroupConfigSchema>;
	children: ReactNode;
	isStringArray?: boolean;
	defaultValues?: string[] | number[];
}) => {
	const schema = Type.Object({
		example: isStringArray
			? getStringArrayWithMinMax(config)
			: getNumericArrayWithMinMax(config),
	});

	const form = useForm({
		defaultValues: { example: defaultValues ?? [] },
		resolver: typeboxResolver(schema),
		reValidateMode: "onBlur",
	});
	const values = useWatch({ control: form.control, name: "example" });

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(vi.fn())}>
				{children}
				<button type="submit">Submit</button>
			</form>
			<div>
				<span>Selected</span>
				<ol>
					{values.map((v) => {
						return (
							<li data-testid={`selected-${v}`} key={v}>
								{v}
							</li>
						);
					})}
				</ol>
			</div>
		</Form>
	);
};

describe("Checkbox group element", () => {
	/** Helper to force the form to validate by clicking submit (so error messages render) */
	const validateForm = async () => {
		const submitButton = screen.getByText("Submit");
		await act(async () => {
			fireEvent.click(submitButton);
		});
	};
	/** Helper that clicks a checkbox to check/uncheck it */
	const check = (value: number | string) => {
		const c = screen.getByTestId(`checkbox-${value}`);
		fireEvent.click(c);
	};
	it("renders a numeric array", async () => {
		const config: Static<typeof checkboxGroupConfigSchema> = { values: [0, 1, 2, 3, 4, 5] };
		render(
			<FormWrapper config={config}>
				<CheckboxGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.NumericArray}
				/>
			</FormWrapper>
		);
		expect(screen.getByTestId("checkbox-1")).toBeDefined();
		const c1 = screen.getByTestId("checkbox-1");
		fireEvent.click(c1);
		expect(screen.getByTestId("selected-1")).toBeDefined();
	});

	it("renders a string array", async () => {
		const config: Static<typeof checkboxGroupConfigSchema> = {
			values: ["cats", "dogs", "squirrels", "otters"],
		};
		render(
			<FormWrapper config={config} isStringArray>
				<CheckboxGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.StringArray}
				/>
			</FormWrapper>
		);
		expect(screen.getByTestId("checkbox-cats")).toBeDefined();
		const c1 = screen.getByTestId("checkbox-cats");
		fireEvent.click(c1);
		expect(screen.getByTestId("selected-cats")).toBeDefined();
	});

	it("can initialize", async () => {
		const config: Static<typeof checkboxGroupConfigSchema> = { values: [0, 1, 2, 3, 4, 5] };
		const defaultValues = [0, 1];
		render(
			<FormWrapper config={config} defaultValues={defaultValues}>
				<CheckboxGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.NumericArray}
				/>
			</FormWrapper>
		);
		defaultValues.map((v) => {
			expect(screen.getByTestId(`checkbox-${v}`).ariaChecked).toEqual("true");
			expect(screen.getByTestId(`selected-${v}`)).toBeDefined();
		});
	});

	describe("min max checking", () => {
		it("exactly", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.Exactly,
				numCheckboxes: 2,
			};
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			expect(screen.getByTestId("checkbox-1")).toBeDefined();
			check(1);
			expect(screen.getByTestId("selected-1")).toBeDefined();
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select exactly 2"
			);
			check(2);
			await validateForm();
			expect(screen.queryByTestId("error-message")).toBeNull();
			check(3);
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select exactly 2"
			);
		});
		it("at least", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.AtLeast,
				numCheckboxes: 2,
			};
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			expect(screen.getByTestId("checkbox-1")).toBeDefined();
			check(1);
			expect(screen.getByTestId("selected-1")).toBeDefined();
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select at least 2"
			);
			check(2);
			await validateForm();
			expect(screen.queryByTestId("error-message")).toBeNull();
			check(3);
			expect(screen.queryByTestId("error-message")).toBeNull();
		});
		it("at most", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.AtMost,
				numCheckboxes: 2,
			};
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			expect(screen.getByTestId("checkbox-1")).toBeDefined();
			check(1);
			expect(screen.getByTestId("selected-1")).toBeDefined();
			await validateForm();
			expect(screen.queryByTestId("error-message")).toBeNull();
			check(2);
			await validateForm();
			expect(screen.queryByTestId("error-message")).toBeNull();
			check(3);
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select at most 2"
			);
		});
	});

	describe("other field", () => {
		const config: Static<typeof checkboxGroupConfigSchema> = {
			values: [0, 1, 2, 3, 4, 5],
			includeOther: true,
		};

		it("can add and remove other field", async () => {
			const user = userEvent.setup();
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			const otherField = screen.getByTestId("other-field");
			// Add and remove an 'other' field
			const otherValue = "7";
			await user.type(otherField, otherValue);
			expect(screen.queryAllByRole("listitem").length).toBe(1);
			expect(screen.getByTestId("selected-7")).toBeDefined();
			await user.type(otherField, "{backspace}");
			expect(screen.queryByTestId("selected-7")).toBeNull();
			expect(screen.queryByRole("listitem")).toBeNull();

			// Add 'other' field back and also a regular checkbox
			await user.type(otherField, otherValue);
			await user.click(screen.getByTestId("checkbox-0"));
			expect(screen.queryAllByRole("listitem").length).toBe(2);
			expect(screen.getByTestId("selected-0")).toBeDefined();
			expect(screen.getByTestId("selected-7")).toBeDefined();
		});

		it("can handle other fields that overlap with checkbox values", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				includeOther: true,
			};
			const user = userEvent.setup();
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			const otherField = screen.getByTestId("other-field");
			await user.click(screen.getByTestId("checkbox-1"));
			await user.type(otherField, "12");
			expect(screen.queryAllByRole("listitem").length).toBe(2);
			expect(screen.getByTestId("selected-1")).toBeDefined();
			expect(screen.getByTestId("selected-12")).toBeDefined();
			await user.click(screen.getByTestId("checkbox-3"));
			expect(screen.queryAllByRole("listitem").length).toBe(3);
			await user.type(otherField, "{backspace}{backspace}");
			expect(screen.queryAllByRole("listitem").length).toBe(2);

			// Add 1 as other, but 1 is already a checked value
			await user.type(otherField, "1");
			expect(screen.queryAllByRole("listitem").length).toBe(2);
			await user.type(otherField, "3");
			expect(screen.queryAllByRole("listitem").length).toBe(3);
			expect(screen.getByTestId("selected-1")).toBeDefined();
			expect(screen.getByTestId("selected-3")).toBeDefined();
			expect(screen.getByTestId("selected-13")).toBeDefined();
		});

		it("can initialize other field", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				includeOther: true,
			};
			const defaultValues = [0, 1, 72];
			render(
				<FormWrapper config={config} defaultValues={defaultValues}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			[0, 1].map((v) => {
				expect(screen.getByTestId(`checkbox-${v}`).ariaChecked).toEqual("true");
				expect(screen.getByTestId(`selected-${v}`)).toBeDefined();
			});
			expect((screen.getByTestId("other-field") as HTMLInputElement).value).toBe("72");
		});

		it("handles other fields with min/max", async () => {
			const user = userEvent.setup();
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.Exactly,
				numCheckboxes: 2,
				includeOther: true,
			};
			render(
				<FormWrapper config={config}>
					<CheckboxGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			);
			// Only one 'other' field should be invalid
			const otherField = screen.getByTestId("other-field");
			const otherValue = "7";
			await user.type(otherField, otherValue);
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select exactly 2"
			);
			// Adding a checkbox gets us to exactly 2
			expect(screen.getByTestId("checkbox-1")).toBeDefined();
			check(1);
			await validateForm();
			expect(screen.queryByTestId("error-message")).toBeNull();

			// Going one over puts us back in an error state
			check(3);
			await validateForm();
			expect(screen.queryByTestId("error-message")?.textContent).toContain(
				"Please select exactly 2"
			);
		});
	});
});

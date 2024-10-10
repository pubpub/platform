import { describe } from "node:test";

import type { Static } from "@sinclair/typebox";
import type { ReactNode } from "react";

import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { checkboxGroupConfigSchema, MinMaxChoices } from "schemas";
import { getNumericArrayWithMinMax } from "schemas/src/schemas";
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
	onSubmit,
	config,
	children,
}: {
	onSubmit: any;
	config: any;
	children: ReactNode;
}) => {
	const schema = Type.Object({
		example: getNumericArrayWithMinMax(config),
	});

	const form = useForm({
		defaultValues: { example: [] },
		resolver: typeboxResolver(schema),
		reValidateMode: "onBlur",
	});
	const values = form.watch("example");

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
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
	it("renders a basic numeric array", async () => {
		const config: Static<typeof checkboxGroupConfigSchema> = { values: [1, 2, 3, 4, 5] };
		render(
			<FormWrapper onSubmit={vi.fn()} config={config}>
				<CheckboxGroupElement
					name="example"
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

	describe("min max checking", () => {
		const validateForm = async () => {
			const submitButton = screen.getByText("Submit");
			await act(async () => {
				fireEvent.click(submitButton);
			});
		};
		const check = (value: number) => {
			const c = screen.getByTestId(`checkbox-${value}`);
			fireEvent.click(c);
		};
		it("exactly", async () => {
			const config: Static<typeof checkboxGroupConfigSchema> = {
				values: [1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.Exactly,
				numCheckboxes: 2,
			};
			const submit = vi.fn();
			render(
				<FormWrapper onSubmit={submit} config={config}>
					<CheckboxGroupElement
						name="example"
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
				values: [1, 2, 3, 4, 5],
				userShouldSelect: MinMaxChoices.AtLeast,
				numCheckboxes: 2,
			};
			const submit = vi.fn();
			render(
				<FormWrapper onSubmit={submit} config={config}>
					<CheckboxGroupElement
						name="example"
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
			const submit = vi.fn();
			render(
				<FormWrapper onSubmit={submit} config={config}>
					<CheckboxGroupElement
						name="example"
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
});

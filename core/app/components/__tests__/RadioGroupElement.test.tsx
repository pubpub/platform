import { describe } from "node:test"

import type { Static } from "@sinclair/typebox"
import type { ReactNode } from "react"

import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { checkboxGroupConfigSchema, radioGroupConfigSchema } from "schemas"
import { NumericArray, StringArray } from "schemas/src/schemas"
import { expect, it, vi } from "vitest"

import { CoreSchemaType } from "db/public"
import { Form } from "ui/form"

import { RadioGroupElement } from "../forms/elements/RadioGroupElement"

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Stub the global ResizeObserver
vi.stubGlobal("ResizeObserver", ResizeObserverMock)

const FormWrapper = ({
	children,
	isStringArray,
	defaultValues,
}: {
	children: ReactNode
	isStringArray?: boolean
	defaultValues?: string[] | number[]
}) => {
	const schema = Type.Object({
		example: isStringArray ? StringArray : NumericArray,
	})

	const form = useForm({
		defaultValues: { example: defaultValues ?? [] },
		resolver: typeboxResolver(schema),
		reValidateMode: "onBlur",
	})
	const values = form.watch("example")

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
						)
					})}
				</ol>
			</div>
		</Form>
	)
}

describe("Radio group element", () => {
	it("renders a numeric array", async () => {
		const config: Static<typeof radioGroupConfigSchema> = { values: [0, 1, 2, 3, 4, 5] }
		render(
			<FormWrapper>
				<RadioGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.NumericArray}
				/>
			</FormWrapper>
		)
		expect(screen.getByTestId("radio-1")).toBeDefined()
		const c1 = screen.getByTestId("radio-1")
		fireEvent.click(c1)
		expect(screen.getByTestId("selected-1")).toBeDefined()
		fireEvent.click(screen.getByTestId("radio-2"))
		expect(screen.queryByTestId("selected-1")).toBeNull()
		expect(screen.getByTestId("selected-2")).toBeDefined()
	})

	it("renders a string array", async () => {
		const config: Static<typeof checkboxGroupConfigSchema> = {
			values: ["cats", "dogs", "squirrels", "otters"],
		}
		render(
			<FormWrapper isStringArray>
				<RadioGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.StringArray}
				/>
			</FormWrapper>
		)
		expect(screen.getByTestId("radio-cats")).toBeDefined()
		const c1 = screen.getByTestId("radio-cats")
		fireEvent.click(c1)
		expect(screen.getByTestId("selected-cats")).toBeDefined()
		fireEvent.click(screen.getByTestId("radio-dogs"))
		expect(screen.queryByTestId("selected-cats")).toBeNull()
		expect(screen.getByTestId("selected-dogs")).toBeDefined()
	})

	it("can initialize", async () => {
		const config: Static<typeof radioGroupConfigSchema> = { values: [0, 1, 2, 3, 4, 5] }
		render(
			<FormWrapper defaultValues={[0]}>
				<RadioGroupElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.NumericArray}
				/>
			</FormWrapper>
		)
		expect(screen.getByTestId("radio-0").ariaChecked).toEqual("true")
		expect(screen.getByTestId("selected-0")).toBeDefined()
	})

	describe("other field", () => {
		const config: Static<typeof radioGroupConfigSchema> = {
			values: [0, 1, 2, 3, 4, 5],
			includeOther: true,
		}

		it("can add and remove other field", async () => {
			const user = userEvent.setup()
			render(
				<FormWrapper>
					<RadioGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			)
			const otherField = screen.getByTestId("other-field")
			// Add an 'other' field
			const otherValue = "7"
			await user.type(otherField, otherValue)
			expect(screen.queryAllByRole("listitem").length).toBe(1)
			expect(screen.getByTestId("selected-7")).toBeDefined()

			// Remove the 'other' field
			await user.type(otherField, "{backspace}")
			expect(screen.queryByTestId("selected-7")).toBeNull()
			expect(screen.queryByRole("listitem")).toBeNull()

			// Add the 'other' field back
			await user.type(otherField, otherValue)
			expect(screen.getByTestId("selected-7")).toBeDefined()

			// Clicking a radio should clear the other field
			await user.click(screen.getByTestId("radio-0"))
			expect(screen.queryAllByRole("listitem").length).toBe(1)
			expect(screen.queryByTestId("selected-0")).toBeDefined()
			expect(screen.queryByTestId("selected-7")).toBeNull()

			// Adding the 'other' field back should clear the radio
			await user.type(otherField, otherValue)
			expect(screen.queryAllByRole("listitem").length).toBe(1)
			expect(screen.queryByTestId("selected-0")).toBeNull()
			expect(screen.queryByTestId("selected-7")).toBeDefined()
		})

		it("can initialize other field", async () => {
			const config: Static<typeof radioGroupConfigSchema> = {
				values: [0, 1, 2, 3, 4, 5],
				includeOther: true,
			}
			render(
				<FormWrapper defaultValues={[123]}>
					<RadioGroupElement
						slug="example"
						label="Example"
						config={config}
						schemaName={CoreSchemaType.NumericArray}
					/>
				</FormWrapper>
			)
			expect((screen.getByTestId("other-field") as HTMLInputElement).value).toBe("123")
			expect(screen.getByTestId("selected-123")).toBeDefined()
		})
	})
})

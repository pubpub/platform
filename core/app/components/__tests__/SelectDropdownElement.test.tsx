import { describe } from "node:test"

import type { Static } from "@sinclair/typebox"
import type { ReactNode } from "react"

import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import {
	checkboxGroupConfigSchema,
	radioGroupConfigSchema,
	selectDropdownConfigSchema,
} from "schemas"
import { NumericArray, StringArray } from "schemas/src/schemas"
import { expect, it, vi } from "vitest"

import { CoreSchemaType } from "db/public"
import { Form } from "ui/form"

import { SelectDropdownElement } from "../forms/elements/SelectDropdownElement"

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Stub the global ResizeObserver
vi.stubGlobal("ResizeObserver", ResizeObserverMock)
window.HTMLElement.prototype.hasPointerCapture = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()

const FormWrapper = ({
	children,
	isStringArray,
}: {
	children: ReactNode
	isStringArray?: boolean
}) => {
	const schema = Type.Object({
		example: isStringArray ? StringArray : NumericArray,
	})

	const form = useForm({
		defaultValues: { example: [] },
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

describe("Select dropdown element", () => {
	it("renders a numeric array", async () => {
		const user = userEvent.setup()
		const config: Static<typeof selectDropdownConfigSchema> = { values: [0, 1, 2, 3, 4, 5] }
		render(
			<FormWrapper>
				<SelectDropdownElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.NumericArray}
				/>
			</FormWrapper>
		)
		await user.click(screen.getByRole("combobox"))
		await user.click(screen.getByRole("option", { name: "3" }))
		expect(screen.getByTestId("selected-3")).toBeDefined()

		// Change the value
		await user.click(screen.getByRole("combobox"))
		await user.click(screen.getByRole("option", { name: "0" }))
		expect(screen.getByTestId("selected-0")).toBeDefined()
		expect(screen.queryAllByRole("listitem").length).toBe(1)
	})

	it("renders a string array", async () => {
		const user = userEvent.setup()
		const config: Static<typeof selectDropdownConfigSchema> = {
			values: ["cats", "dogs", "squirrels", "otters"],
		}
		render(
			<FormWrapper isStringArray>
				<SelectDropdownElement
					slug="example"
					label="Example"
					config={config}
					schemaName={CoreSchemaType.StringArray}
				/>
			</FormWrapper>
		)
		await user.click(screen.getByRole("combobox"))
		await user.click(screen.getByRole("option", { name: "cats" }))
		expect(screen.getByTestId("selected-cats")).toBeDefined()

		// Change the value
		await user.click(screen.getByRole("combobox"))
		await user.click(screen.getByRole("option", { name: "dogs" }))
		expect(screen.getByTestId("selected-dogs")).toBeDefined()
		expect(screen.queryAllByRole("listitem").length).toBe(1)
	})
})

import { describe } from "node:test"

import type { ColumnDef } from "@tanstack/react-table"

import { createColumnHelper } from "@tanstack/react-table"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { DataTable } from "../DataTable/v2/DataTable"

interface Animal {
	name: string
	species: string
}
const DATA: Animal[] = [
	{ name: "Peach", species: "cat" },
	{ name: "Woody", species: "dog" },
]

const columnHelper = createColumnHelper<Animal>()
const columns = [
	columnHelper.accessor("name", { header: () => "Name", cell: (d) => d.getValue() }),
	columnHelper.accessor("species", { header: () => "Species", cell: (d) => d.getValue() }),
] as const satisfies ColumnDef<Animal, string>[]

describe("DataTable", () => {
	describe("paging", () => {
		it("does not render paging elements when there is only one page of data", async () => {
			render(<DataTable columns={columns} data={DATA} />)
			expect(screen.queryByTestId("data-table-pagination")).toBeNull()
		})

		it("renders paging elements when there is paged data", async () => {
			const pagedData = [...DATA, ...DATA, ...DATA, ...DATA, ...DATA, ...DATA, ...DATA]
			render(<DataTable columns={columns} data={pagedData} />)
			const { getByText } = within(screen.getByTestId("data-table-pagination"))
			expect(getByText("Page 1 of 2")).toBeDefined()
		})
	})

	describe("row clicking", () => {
		it("can use a row click handler", async () => {
			const rowClick = vi.fn()
			render(<DataTable columns={columns} data={DATA} onRowClick={rowClick} />)
			const row = screen.getByText(DATA[0].name)
			fireEvent.click(row)
			expect(rowClick).toHaveBeenCalledOnce()
		})

		it("will not trigger row click on button click", async () => {
			const rowClick = vi.fn()
			const buttonClick = vi.fn()
			const columnsWithButton = [
				...columns,
				{
					id: "test-button",
					header: () => "Test",
					cell: ({ row }) => (
						<button onClick={buttonClick} data-testid={`test-btn-${row.id}`}>
							test button
						</button>
					),
				},
			] satisfies ColumnDef<Animal, string>[]
			render(<DataTable columns={columnsWithButton} data={DATA} onRowClick={rowClick} />)
			const button = screen.getByTestId(`test-btn-0`)
			fireEvent.click(button)
			expect(buttonClick).toHaveBeenCalledOnce()
			expect(rowClick).toHaveBeenCalledTimes(0)
		})
	})
})

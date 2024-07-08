import { afterEach, describe } from "node:test";

import type { ColumnDef } from "@tanstack/react-table";

import { createColumnHelper } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { DataTable } from "../DataTable/v2/DataTable";

interface Animal {
	name: string;
	species: string;
}
const DATA: Animal[] = [
	{ name: "Peach", species: "cat" },
	{ name: "Woody", species: "dog" },
];

const columnHelper = createColumnHelper<Animal>();
const columns = [
	columnHelper.accessor("name", { header: () => "Name", cell: (d) => d.getValue() }),
	columnHelper.accessor("species", { header: () => "Species", cell: (d) => d.getValue() }),
] as const satisfies ColumnDef<Animal, unknown>[];

describe("DataTable", () => {
	it("does not render paging elements when there is only one page of data", async () => {
		render(<DataTable columns={columns} data={DATA} />);
		expect(screen.queryByTestId("data-table-pagination")).toBeNull();
	});

	it("renders paging elements when there is paged data", async () => {
		const pagedData = [...DATA, ...DATA, ...DATA, ...DATA, ...DATA, ...DATA, ...DATA];
		render(<DataTable columns={columns} data={pagedData} />);
		const { getByText } = within(screen.getByTestId("data-table-pagination"));
		expect(getByText("Page 1 of 2")).toBeDefined();
	});

	it("can use a row click handler", async () => {
		const rowClick = vi.fn();
		render(<DataTable columns={columns} data={DATA} onRowClick={rowClick} />);
		const row = screen.getByText(DATA[0].name);
		fireEvent.click(row);
		expect(rowClick).toHaveBeenCalledOnce();
	});
});

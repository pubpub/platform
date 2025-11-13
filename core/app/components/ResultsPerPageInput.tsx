"use client";

import { useQueryStates } from "nuqs";

import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { cn } from "utils";

import { dataTableParsers } from "./DataTable/PubsDataTable/validations";

const PAGE_OPTIONS = [10, 25, 50, 100];

export const ResultsPerPageInput = ({ className }: { className?: string }) => {
	const [{ perPage }, setPaging] = useQueryStates(dataTableParsers);

	return (
		<div className="flex items-center gap-2 whitespace-nowrap">
			<Label
				htmlFor="pagination-per-page"
				className="hidden text-sm font-normal md:block md:text-base"
			>
				Results per page:
			</Label>
			<Select
				value={`${perPage}`}
				onValueChange={(value) => {
					setPaging({ perPage: parseInt(value) }, { shallow: false });
				}}
			>
				<SelectTrigger
					className={cn(
						"h-8 w-[4.5rem] text-sm md:h-10 md:w-[6rem] md:text-base",
						className
					)}
				>
					<SelectValue placeholder={perPage} />
				</SelectTrigger>
				<SelectContent side="top">
					{PAGE_OPTIONS.map((pageSize) => (
						<SelectItem key={pageSize} value={`${pageSize}`}>
							{pageSize}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

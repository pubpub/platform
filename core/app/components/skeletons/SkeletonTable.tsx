import { Skeleton } from "ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "ui/table";

function SkeletonTable() {
	return (
		<div className="mb-2 rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Skeleton className="h-6 w-full" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-6 w-full" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-6 w-full" />
						</TableHead>
						{/* Add more headers as needed */}
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 5 }).map((_, index) => (
						<TableRow key={index}>
							<TableCell>
								<Skeleton className="h-4 w-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-full" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export default SkeletonTable;

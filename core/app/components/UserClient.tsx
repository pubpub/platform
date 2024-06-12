"use client";

import { ChangeEvent } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "ui/dropdown-menu";
import { FormField } from "ui/form";
import { Input } from "ui/input";
import { Popover, PopoverContent } from "ui/popover";
import { Select } from "ui/select";

import { Users } from "~/kysely/types/public/Users";

export function UserClient({ potentialUsers, name }: { potentialUsers: Users[]; name: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const [onChange] = useDebounce((evt: ChangeEvent<HTMLInputElement>) => {
		const email = evt.target.value;

		const newParams = new URLSearchParams(params);
		newParams.set("email", email);
		router.replace(`${pathname}?${newParams.toString()}`);
	}, 400);

	return (
		<FormField
			name={name}
			render={({ field }) => (
				<div className="flex flex-col gap-2">
					<Input onChange={onChange} />
					{potentialUsers.map((user) => (
						<div key={user.id} className="flex items-center gap-2">
							<img src={user.image} className="h-8 w-8" />
							<div className="flex-1">
								<div className="text-sm font-medium">{user.name}</div>
								<div className="text-xs text-gray-500">{user.email}</div>
							</div>
						</div>
					))}
				</div>
			)}
		/>
	);
}

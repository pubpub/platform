"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { AutoComplete } from "ui/autocomplete";
import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { Users } from "~/kysely/types/public/Users";

export function UserSelectClient({ users, fieldName }: { users: Users[]; fieldName: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const options = useMemo(
		() =>
			users.map((user) => ({
				value: user.id,
				label: user.email,
			})),
		[users]
	);

	const onInputValueChange = useDebouncedCallback((value: string) => {
		const newParams = new URLSearchParams(params);
		newParams.set("query", value);
		router.replace(`${pathname}?${newParams.toString()}`);
	}, 400);

	return (
		<TooltipProvider>
			<div className="flex items-start gap-x-2 overflow-visible">
				<FormField
					name={fieldName}
					render={(field) => (
						<FormItem className="flex w-1/2 flex-col gap-y-1">
							<FormLabel className="flex items-center gap-x-2 text-sm font-normal text-gray-700">
								<span>Response field</span>
								<Tooltip>
									<TooltipTrigger>
										<Info size="12" />
									</TooltipTrigger>
									<TooltipContent className="prose max-w-sm text-xs">
										You can use{" "}
										<a
											href="https://goessner.net/articles/JsonPath/"
											target="_blank"
											rel="noreferrer"
											className="font-bold underline"
										>
											JSONPath
										</a>{" "}
										syntax to select a field from the JSON body.
									</TooltipContent>
								</Tooltip>
							</FormLabel>
							<AutoComplete
								value={options.find((option) => option.value === field.field.value)}
								options={options}
								empty={<div>Hi</div>}
								onInputValueChange={onInputValueChange}
								onValueChange={(option) => field.field.onChange(option.value)}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</TooltipProvider>
	);
}

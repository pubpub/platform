"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import type { PubTypes } from "db/public";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Loader2 } from "ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

export const PubTypeFormClient = ({ pubTypes }: { pubTypes: PubTypes[] }) => {
	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const pathWithoutFormParam = useMemo(() => {
		const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
		urlSearchParams.delete("remove-pub-form");
		return `${path}?${urlSearchParams.toString()}`;
	}, [path, searchParams]);

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit = async () => {
		// TODO: redirect
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="pubTypeId"
					render={({ field }) => (
						<FormItem className="flex flex-col gap-y-1">
							<div className="flex items-center justify-between">
								<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Pub type
								</FormLabel>
							</div>
							<Select
								{...field}
								onValueChange={(value) => {
									field.onChange(value);
								}}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a pub type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{pubTypes.map((pubType) => (
										<SelectItem key={pubType.id} value={pubType.id}>
											{pubType.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
				<div className="flex w-full items-center justify-end gap-x-4">
					<Button type="button" onClick={closeForm}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={form.formState.isSubmitting || !form.formState.isValid}
						className="flex items-center gap-x-2"
					>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Create Pub"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
};

"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { Loader2, Trash } from "ui/icon";
import { toast } from "ui/use-toast";

import { useServerAction } from "~/lib/serverActions";
import * as actions from "./PubEditor/actions";

export const PubRemoveForm = ({ pubId }: { pubId: PubsId }) => {
	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const runRemovePub = useServerAction(actions.removePub);

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
		const result = await runRemovePub({
			pubId,
			path: pathWithoutFormParam,
		});

		if (result && "success" in result) {
			toast({
				title: "Success",
				description: result.report,
			});
			closeForm();
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<p>Are you sure you want to remove this pub? This cannot be undone</p>
				<div className="flex w-full items-center justify-end gap-x-4">
					<Button type="button" onClick={closeForm}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="destructive"
						disabled={form.formState.isSubmitting || !form.formState.isValid}
						className="flex items-center gap-x-2"
					>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<Trash size="12" />
								Permanently Remove Pub
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
};

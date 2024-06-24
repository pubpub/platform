"use client";

import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { Stages } from "db/public/Stages";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ajvResolver } from "@hookform/resolvers/ajv";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useForm } from "react-hook-form";

import type { GetPubResponseBody } from "contracts";
import { buildSchemaFromPubFields, SchemaBasedFormFields } from "@pubpub/sdk/react";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { Loader2, Pencil, Trash } from "ui/icon";
import { toast } from "ui/use-toast";

import type { getPubType } from "~/lib/server/pub";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export const PubRemoveForm = ({ pubId }: { pubId: PubsId }) => {
	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
	});

	const runRemovePub = useServerAction(actions.removePub);

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete("remove-pub-form");
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

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

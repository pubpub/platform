"use client";

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
import { Loader2, Pencil } from "ui/icon";
import { toast } from "ui/use-toast";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { Stages } from "~/kysely/types/public/Stages";
import type { getPubType } from "~/lib/server/pub";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export const PubUpdateForm = ({
	pub,
	pubType,
}: {
	pub: GetPubResponseBody;
	pubType: NonNullable<Awaited<ReturnType<typeof getPubType>>>;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) => {
	const { compiledSchema, uncompiledSchema } = useMemo(() => {
		const uncompiledSchema = buildSchemaFromPubFields(
			//  @ts-expect-error FIXME: Schema types are different
			pubType,
			[]
		);
		const compiledSchema = new Ajv({
			formats: fullFormats,
		}).addSchema(uncompiledSchema, "schema");
		return { compiledSchema, uncompiledSchema };
	}, [pubType]);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: uncompiledSchema
			? ajvResolver(uncompiledSchema, {
					formats: fullFormats,
				})
			: undefined,
	});

	const runUpdatePub = useServerAction(actions.updatePub);

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete("update-pub-form");
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit = async ({ ...values }: { pubType: string; stage: string }) => {
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			communityId: pubType.communityId as CommunitiesId,
			path: pathWithoutFormParam,
			fields: Object.entries(values).reduce((acc, [key, value]) => {
				const id = pubType?.fields.find((f) => f.slug === key)?.id;
				if (id) {
					acc[id] = { slug: key, value };
				}
				return acc;
			}, {}),
		});

		if (result && "success" in result) {
			toast({
				title: "Success",
				description: result.report,
			});
			closeForm();
		}
	};

	const memoizedForm = useMemo(() => {
		if (!compiledSchema) {
			return null;
		}
		return (
			<SchemaBasedFormFields
				compiledSchema={compiledSchema}
				key={pubType.id}
				existingValues={pub.values}
				control={form.control}
				upload={() => {}}
			/>
		);
	}, [compiledSchema]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				{memoizedForm}
				<Button
					type="submit"
					disabled={form.formState.isSubmitting || !form.formState.isValid}
					className="flex items-center gap-x-2"
				>
					{form.formState.isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<>
							<Pencil size="12" />
							Update Pub
						</>
					)}
				</Button>
			</form>
		</Form>
	);
};

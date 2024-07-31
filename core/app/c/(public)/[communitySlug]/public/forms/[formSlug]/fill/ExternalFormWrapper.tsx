"use client";

/**
 * Note: we have two "form"s at play here: one is the Form specific to PubPub (renamed to PubPubForm)
 * and the other is a form as in react-hook-form.
 */
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import type { Form as PubPubForm } from "~/lib/server/form";
import * as actions from "~/app/components/PubCRUD/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { SAVE_TIME_QUERY_PARAM } from "./SaveStatus";

const SAVE_WAIT_MS = 2000;

export const ExternalFormWrapper = ({
	pub,
	elements,
	className,
	children,
}: {
	pub: GetPubResponseBody;
	elements: PubPubForm["elements"];
	children: ReactNode;
	className?: string;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout>();
	const runUpdatePub = useServerAction(actions.upsertPubValues);
	const handleSubmit = async (values: FieldValues, autoSave = false) => {
		const { pubFields, ...fields } = values;
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			fields,
		});
		if (didSucceed(result)) {
			if (!autoSave) {
				toast({
					title: "Success",
					description: "Pub updated",
				});
			}
			const newParams = new URLSearchParams(params);
			newParams.set(SAVE_TIME_QUERY_PARAM, `${new Date().getTime()}`);
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
		}
	};
	const schema = Type.Object(
		Object.fromEntries(
			elements.map((e) => [
				e.slug as string | undefined,
				e.schemaName
					? Type.Optional(getJsonSchemaByCoreSchemaType(e.schemaName))
					: undefined,
			])
		)
	);
	const methods = useForm({ resolver: typeboxResolver(schema), defaultValues: pub.values });
	const isSubmitting = methods.formState.isSubmitting;

	const handleAutoSave = (values: FieldValues) => {
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		const newTimer = setTimeout(() => {
			if (methods.formState.isValid) {
				handleSubmit(values, true);
			}
		}, SAVE_WAIT_MS);
		setSaveTimer(newTimer);
	};

	return (
		<Form {...methods}>
			<form
				onChange={methods.handleSubmit(handleAutoSave)}
				onSubmit={methods.handleSubmit((values) => handleSubmit(values))}
				className={cn("relative flex flex-col gap-6", className)}
			>
				{children}
				<Button
					type="submit"
					disabled={isSubmitting}
					// Make the button fixed next to the bottom of the form as user scrolls
					className="sticky bottom-4 -mr-[100px] -mt-[68px] ml-auto"
				>
					Submit
				</Button>
			</form>
		</Form>
	);
};

import type { Metadata } from "next";

import partition from "lodash.partition";

import type { CommunitiesId } from "db/public";
import { FormInput } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";
import { cn } from "utils";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { ActiveArchiveTabs } from "~/app/components/ActiveArchiveTabs";
import { getPageLoginData } from "~/lib/auth/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { FieldsTable } from "./FieldsTable";
import { NewFieldButton } from "./NewFieldButton";

type Props = { params: { communitySlug: string } };

export const metadata: Metadata = {
	title: "Fields",
};

const EmptyState = ({ className }: { className?: string }) => {
	return (
		<div className={cn("flex h-full items-center justify-center", className)}>
			<div className="flex max-w-[444px] flex-col items-center justify-center text-foreground">
				<h2 className="mb-2 text-lg font-semibold">You don’t have any fields yet</h2>
				<p className="mb-6 text-center text-sm">
					Fields are reusable data formats that are used to define types.
				</p>
				<NewFieldButton />
			</div>
		</div>
	);
};

export default async function Page({ params }: Props) {
	const loginData = await getPageLoginData();
	const community = await findCommunityBySlug(params.communitySlug);
	const pubFields = await getPubFields({
		communityId: community?.id as CommunitiesId,
		includeRelations: true,
	}).executeTakeFirst();

	if (!pubFields || !pubFields.fields) {
		return null;
	}

	const fields = Object.values(pubFields.fields);

	const hasFields = !!Object.keys(fields).length;
	const [active, archived] = partition(fields, (field) => !field.isArchived);

	return (
		<PubFieldProvider pubFields={pubFields.fields}>
			<ContentLayout
				title={
					<>
						<FormInput size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
						Fields
					</>
				}
				headingAction={<NewFieldButton />}
			>
				<div className="m-4">
					{archived.length ? (
						<ActiveArchiveTabs
							activeContent={<FieldsTable fields={active} />}
							archiveContent={<FieldsTable fields={archived} />}
						/>
					) : (
						<>
							<FieldsTable fields={active} />
							{!hasFields ? <EmptyState className="mt-12" /> : null}{" "}
						</>
					)}
				</div>
			</ContentLayout>
		</PubFieldProvider>
	);
}

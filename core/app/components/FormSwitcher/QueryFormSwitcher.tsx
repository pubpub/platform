"use client";

import { useState } from "react";
import { skipToken } from "@tanstack/react-query";

import type { FormsId } from "db/public";
import { Button } from "ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";

import type { SimpleForm } from "~/lib/server/form";
import { client } from "~/lib/api";
import { useCommunity } from "../providers/CommunityProvider";
import { useFormSwitcherContext } from "./FormSwitcherContext";

const FormSwitcher = ({ forms }: { forms: SimpleForm[] }) => {
	const community = useCommunity();
	const { selectedForm, setSelectedForm } = useFormSwitcherContext();
	const [selectedFormId, setSelectedFormId] = useState(selectedForm?.id);
	const { isLoading, refetch } = client.forms.get.useQuery({
		enabled: false,
		queryKey: ["getForm", selectedFormId, community.slug],
		queryData: selectedFormId
			? { params: { formId: selectedFormId, communitySlug: community.slug } }
			: skipToken,
		select(data) {
			if (data.body) {
				setSelectedForm(data.body);
			}
		},
		throwOnError(error, query) {
			toast({
				title: "Error",
				description: `Unable to switch forms`,
				variant: "destructive",
			});
			return false;
		},
	});

	if (!forms.length) {
		return null;
	}

	const switchForms = () => {
		refetch();
	};

	return (
		<div>
			<Select
				onValueChange={(value: FormsId) => {
					setSelectedFormId(value);
				}}
				disabled={isLoading}
			>
				<SelectTrigger className="">
					<SelectValue placeholder="Form" />
				</SelectTrigger>
				<SelectContent>
					{forms.map((form) => (
						<SelectItem key={form.id} value={form.id}>
							{form.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button onClick={switchForms}>Switch forms</Button>
		</div>
	);
};

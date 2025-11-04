"use client";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { memberSelectConfigSchema } from "schemas";

import type { CommunityMembershipsId } from "db/public";
import { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";

import type { ElementProps } from "../types";
import { MemberSelectClientFetch } from "../../MemberSelect/MemberSelectClientFetch";
import { useCommunity } from "../../providers/CommunityProvider";

export const MemberSelectElement = ({
	slug,
	label,
	value,
	config,
}: {
	value?: CommunityMembershipsId;
} & ElementProps<InputComponent.memberSelect>) => {
	const community = useCommunity();

	const { control } = useFormContext();

	if (!community) {
		return null;
	}

	if (!Value.Check(memberSelectConfigSchema, config)) {
		return null;
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<MemberSelectClientFetch
								name={slug}
								value={value}
								onChange={field.onChange}
							/>
						</FormControl>
						{config.help && <FormDescription>{config.help}</FormDescription>}
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

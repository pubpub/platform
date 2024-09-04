import { notFound } from "next/navigation";

import type { FormFillPageParams, FormFillPageSearchParams } from "./page";
import { userHasPermissionToForm } from "~/lib/server/form";
import { TokenFailureReason, validateTokenSafe } from "~/lib/server/token";

export const handleFormToken = async ({
	params,
	searchParams,
	onExpired,
	onValidToken = () => {
		throw new Error("Token is unexpectedly valid");
	},
	onNoAccess = notFound,
}: {
	params: FormFillPageParams;
	searchParams: FormFillPageSearchParams;
	/**
	 * What should happen if the token is valid.
	 *
	 * @default throw error
	 */
	onValidToken?: (args: {
		params: FormFillPageParams;
		searchParams: FormFillPageSearchParams & { token: string };
		result: Awaited<ReturnType<typeof validateTokenSafe>> & { isValid: true };
	}) => void;
	/**
	 * What should happen if the token is expired.
	 */
	onExpired: (args: {
		params: FormFillPageParams;
		searchParams: FormFillPageSearchParams & { token: string };
		result: Awaited<ReturnType<typeof validateTokenSafe>> & { isValid: false };
	}) => void;
	/**
	 * What should happen if the user has no access to the page.
	 *
	 * @default notFound
	 */
	onNoAccess?: () => never;
}) => {
	if (searchParams.reason !== TokenFailureReason.expired) {
		// TODO: show no access page
		return onNoAccess();
	}

	const result = await validateTokenSafe(searchParams.token);

	if (result.isValid) {
		return onValidToken({
			params,
			searchParams,
			result,
		});
	}

	if (result.reason !== TokenFailureReason.expired || !result.user) {
		// TODO: show no access page
		return onNoAccess();
	}

	const userHasAccess = await userHasPermissionToForm({
		formSlug: params.formSlug,
		userId: result.user.id,
	});

	if (!userHasAccess) {
		// TODO: show no access page
		return onNoAccess();
	}

	return onExpired({
		params,
		searchParams,
		result,
	});
};

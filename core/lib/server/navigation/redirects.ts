import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

const defaultLoginRedirectError = {
	type: "error",
	title: "You must be logged in to access this page",
	body: "Please log in to continue",
};

export type LoginRedirectOpts = {
	/**
	 * Provide some notice to display on the login page
	 * An `error` will be red, a `notice` will be neutral.
	 *
	 * Set to `false` for no notice.
	 *
	 * @default { type: "error", title: "You must be logged in to access this page", body: "Please log in to continue" }
	 */
	loginNotice?:
		| {
				type: "error" | "notice";
				title: string;
				body?: string;
		  }
		| false;

	/**
	 * Path to redirect the user to after login.
	 * Needs to be of the form `/c/<community-slug>/path`
	 *
	 * @default  currentPathname
	 */
	redirectTo?: string;
};

/**
 * Redirect the user to the login page, with a notice to display.
 */
export const redirectToLogin = (opts?: LoginRedirectOpts) => {
	const searchParams = new URLSearchParams();

	if (opts?.loginNotice !== false) {
		const notice = opts?.loginNotice ?? defaultLoginRedirectError;
		searchParams.set(notice.type, notice.title);
		if (notice.body) {
			searchParams.set("body", notice.body);
		}
	}

	const redirectTo = opts?.redirectTo ?? getPathname();
	if (redirectTo) {
		searchParams.set("redirectTo", redirectTo);
	}

	const basePath = `/login?${searchParams.toString()}`;
	redirect(basePath);
};

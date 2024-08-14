import { getLoginData } from "../loginData";

/**
 * Wraps around a page function to ensure that the user is logged in
 *
 * @example
 * ```ts
 * export default withAuth(async function SomePage({ user }{
 *   // user is guaranteed to be logged in
 * })
 * ```
 */
export function withAuth<
	Params extends {
		params?: { [key: string]: string | string[] };
		searchParams?: { [key: string]: string | string[] };
	} = {},
>(
	page: (
		args: Params & { user: NonNullable<Awaited<ReturnType<typeof getLoginData>>> },
		options?: {
			/**
			 * What to do if the user is not logged in
			 *
			 * By default the user will be redirected to the login page
			 */
			onAuthFail?: (args?: Params) => void | Promise<void>;
		}
	) => Promise<any> | any
) {
	return async (...args: Parameters<typeof page>) => {
		const loginData = await getLoginData();

		if (!loginData) {
			if (args?.[1]?.onAuthFail) {
				return args?.[1]?.onAuthFail(args[0]);
			}
			return;
		}

		return page({
			...args[0],
			user: loginData,
		});
	};
}

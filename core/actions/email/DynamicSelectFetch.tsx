"use client";

import dynamic from "next/dynamic";

// this little trick is necessary because you cannot do `ssr: false` in a file without `use client`
// we want to import this dynamically so the `actions` object doesn't become gigantic everywhere for no reason

const MemberSelectClientFetch = dynamic(
	() =>
		import("~/app/components/MemberSelect/MemberSelectClientFetch").then(
			(mod) => mod.MemberSelectClientFetch
		),
	{
		ssr: false,
	}
);

export default MemberSelectClientFetch;

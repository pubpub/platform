declare module "@preconstruct/next" {
	import type { NextConfig } from "next";
	export default function withPreconstruct(nextConfig: NextConfig): NextConfig;
}

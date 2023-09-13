"use client";

// Although `Integration` is bundled with the "use client" directive, Next
// surfaces an error that the component has no parents with "use client". This
// intermediate module instructs Next to treat `Integration` as a client
// component.
export { Integration } from "@pubpub/sdk/react";

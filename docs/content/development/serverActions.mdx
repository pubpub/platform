# Server Actions

Next.js server actions should be defined with `defineServerAction`. This higher-order function instruments the server action to forward uncaught exceptions to Sentry. The function provided to `defineServerAction` must be both named (i.e. not anonymous) and `async`. This convention is enforced by a custom eslint rule (thanks @tefkah).

```ts
export const generatePDF = defineServerAction(async function generatePDF(pubId: string) {
	// ...
});
```

Uncaught/unhandled errors within server actions are automatically captured by Sentry. If an expected error occurs within the server action, the server action should return an object containing an `error` entry. The value of `error` must be a string. For example:

```ts
try {
	file = await generatePDF(pubId);
} catch (error) {
	return {
		error: "Failed to generate PDF",
	};
}
```

Payloads with an `error` property are called **client exceptions**.

Client exceptions can be automatically handled on the client using the `useServerAction` hook:

```ts
const runGeneratePDF = useServerAction(generatePDF);
const onClick = async (pubId: string) => {
	const result = await runGeneratePDF(pubId);
	// do something with the result
};
```

Client exceptions returned by the wrapped server action will be revealed to the user in a popup. They can also have a `title` entry which controls the title of the error popup. The popup will be titled "Error" if a `title` entry is not provided.

If a server action defined with `defineServerAction` returns a client exception with a `cause` entry, the `cause` will be forwarded to Sentry:

```ts
catch (error) {
  return {
    error: "Failed to generate PDF",
    cause: error, // this error will be captured by Sentry
  }
}
```

The resulting Sentry error ID will be attached to the client exception before it is sent to the client. When `useServerAction` intercepts a client exception with an error ID, it will include the id in the popup shown to the user.

Although `useServerAction` will display an error popup, the result of the server action it invokes are untouched. Therefore, if a server action could return an error, you will want to ensure its result is **not** a client exception before handling it. You can use the `didSucceed` function to check if a server action returned a client exception.

Below is a complete example which

- defines a server action
- returns a client exception in the case of an error
- invokes the server action on the client using `useServerAction`
- handles the server action response appropriately

```ts
// actions.ts
export const generatePDF = defineServerAction(async function generatePDF(pubId: string) {
	try {
		const pub = await getPubById(pubId);
		const pdf = await pdflib.render(makePdfOptions(pub));
		const url = await uploadToS3(pdf);
		return { url };
	} catch (error) {
		return {
			title: "Oh nooooooooooOoo",
			error: "An unexpected issue occurred when generating a PDF",
			cause: error,
		};
	}
});
```

```tsx
// GeneratePDFButton.tsx
import { generatePDF } from "./actions.ts";

export function GeneratePdfButton(props: { pubId: string }) {
	const [url, setUrl] = useState<string>();
	const runGeneratePDF = useServerAction(generatePDF);
	const onClick = async () => {
		const result = await runGeneratePDF(props.pubId);
		if (didSucceed(result)) {
			setUrl(result.url);
		}
	};
	return (
		<div>
			<Button onClick={onClick}>Generate PDF</Button>
			{url && <p>URL: {url}</p>}
		</div>
	);
}
```

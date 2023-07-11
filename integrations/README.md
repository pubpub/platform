# PubPub v7 Integrations

## Manifest

- Identifies itself with a name
- Defines the schema of new Pub fields
- Requests read/write access to existing Pub fields
- ~~Points to a service endpoint??~~

## For discussion

- User inputs "https://integrations.pubpub.org/word-counter" as the integration service URL and we resolve manifest by appending "/pubpub-manifest.json"
- Registration fails if manifest is not found at SERVICE_URL/pubpub-manifest.json
- Should all integrations require configuration (e.g. GET SERVICE_URL/configure) to keep things consistent? Or should manifest have a `"configurable"` field?
- Integration instances are configured lazily. When instance is created, PubPub will open /configure in a new tab (or iframe). But the integration does not tell PubPub whether or not integration was configured successfully.
- Idea here is that integration will re-prompt user to configure if a Pub triggers it down the line.
- If we open in an iframe, could we detect a 404 and notify user that integration doesn't require configuration?

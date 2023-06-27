# Technical Reference

## For Next Time
- Reviews (via Google Forms)
```
#### Minimal definition: automating sending people a link to a form with some instructions -- could even be just upload word document -- getting back notification it's been sent back with the contents.

##### Events
- Editor clicks "request review" button.
- Separate page opens that allows editor to specify reviewer details and instructions (default set in settings).
- Editor clicks send out for review.
- Email gets sent to reviewer.
- A label on Pub changes to "review invitation sent."
- Reviewer clicks link in email.
- Reviewer fills out form and submits it.
- A label on Pub changes to "review submitted."
- Admin gets email notification that reviewer has submitted form.
```
- How are integration front-ends/settings interfaces defined?

## Tuesday June 27, 2023

### Integrations
- "First-party": We think we'll want to build integrations that just access our db directly, and run code on our main process, from our monorepo
- "Third-party": We think others will want to build integrations that are mostly external, with little more than a manifest that exposes a button and interfaces with our API on their server.

#### Structure
- Manifest file
- Standard API
- "Service" the thing doing the thing (google docs, slack, mailchimp, a library, or our code in our repo!)
- "Glue code" - helps us connect to existing services that won't build their own integration (e.g. Google Docs)
- Sometimes "Service" and "Glue code" are the same thing (e.g. a library that does some NLP)

#### Integration Interface Spec

##### Integration high-level
- Integrations are connected to Stages (The specific integration-stage pair is called an 'instance')

- Integrations are given API endpoints to:
  - Set the status of an integration instance
  - Read the list of pubs in an instance's associated stage
  - Read metadata about specific pubIds
  - Write metadata to specific pubId (if no pubId given, it creates a new pub with that metadata).


##### Integrations Table
- name: String
- stageUpdateWebhook:? String
  - We will ping this URL and append `?stageId=<id>` to it
- stageLink:? String[]
    - We will render this URL on each stage as a button with appended `?stageId=<id>`. Should be a link that takes you somewhere, not an action (e.g. 'View Site', not 'Build Site') — we don't want the complexity of rendering button states, asyncs, etc. It's just a link. Sits along side Settings button in Workflow view. Top-right corner in Settings view.
- perPubLink:? String
  - We will render this URL on each pub in the stage as a button with appended `?pubId=<id>`

reviewsv1.pubpub.org
pubpub.org/reviews/

##### Integration Instance table
- name: String
- integrationId: UUID
- stageId: UUID
- usePubLink: Boolean
  - The community can decide whether to render the perPubLink as a button if available
- pubLinkButtonName: String
  - The community can customize the text of the pubLinkButton. If the integration is an google doc, you may want the button to say "Draft" or "Copyedit" or "Comment on Doc"
- pubLinkPrimaryColor: Boolean
  - Whether to use the primary button color for the pub link button. Is it the main action? 
- status: JSON
  - An object that provides a text string (and hex color? or chooses from a set of possible colors?) for the status of the integration, and optionally each pub within it. Use pubId as the key for pubStatus, and `null` as the key for integration status
  - {
		null: {text: "In Progress", color: "yellow"},
		123-4155-12551-1234512: {text: "Processing", color: "yellow"},
		244-3112-124a1-1351b1c: {text: "Complete", color: "green"},
    }
- settings: JSON
  - Integration-specific settings as configured by the community for that specific instance.


##### Implementing
- Integrations are declared in the `/app/integrations` folder. 
  - Each integration contains a `manifest.yaml` and a `/[instanceId]/page.tsx` that builds the settings configuration page for that instance of an integration.
- Details from manifest.yaml are copied to the `integrations` table in the database for runtime querying. The integrations table is only mutated by the function that copies from manifest files. Manifest files are the ground truth, the database table is a convenience.

-

## Monday June 26, 2023

### Integration
- Interface for an external system that creates a side effect.

### Review
- Reviews are a "first-party" integration, meaning built by us (there may be other review integrations).

### Automation
- We're gonna need this at some point.
- We don't think integrations themselves should handle them.

## Thursday June 22, 2023

### Pub Tables
- Existence of a field on a pub is sufficient validation for PubTypes for the MVP -- both for integrations and stages.
- EAV vs. JSONB: going to maintain both for now so we can look into performance as we build.

### Workflows
- Integrations can be connected to any workflow stage.
  - An integration doesn't know anything about the workflow or stage. Either modifies pub metadata or performs a side effect.
- Anything that modifies a Pub's relationship with the workflow is an action.
  - Actions shouldn't change Pub metadata — Pub metadata should be directly edited or changed via integrations.

## Wednesday June 21, 2023

### Pub Types
- Pub types have flexible definitions, which should be editable by users — even if user is just us at the beginning.
- Pub values are declared and stored elsewhere, not on the Pub model.
- Pub types are defined in the db. We may build a UI for adding types, but initially it will likely be us, the community team, or power users.
- The types a Pub satisfies are calculated when the Pub's metadata is modified (or when a Pub type is modified) for downstream integrations and other UI components.

# Technical Reference

## For Next Time
- Layout API endpoints
  - Mostly just receiving pubIds and sending metadata updates to speciffic pubIds

## Thursday June 29
- Proposal: Integrations act on pubs.
  - They can act on 1) specific pubs, 2) all pubs in a given stage(s) over time.
- When creating a new Pub Type, we could provide a "wizard"/helper UI that suggests the fields you'll need based on the integations you want based (e.g. Crossref, Squarespace site builder, Portico deposit).
  - We will have a list of all fields that integrations will need declared in the integration's manifest.
  - A low-fidelity version is just using that list of fields declared in integration manifests to warn users if they input a field that's not used by any integration.


Do we have Axioms?
- Could be ones like:
  - We know a pub's type at its moment of creation
  - Pub Type's declare a minimum set of expected fields for a Pub.




## Wednesday June 28
- Reviews (via Google Forms)

#### Minimal definition: automating sending people a link to a form with some instructions, which they then accept or reject. If they accept and fill out the form, editor receives a notification that the form has been sent back.

##### Events
- Editor clicks "invite reviewers" button.
	- Link to a base URL provided by integration in manifest + PubPub-added query params (in new tab)
		- URL: https://reviews.pubpub.org/review?pubId=123&instanceId=avcd
- Interface opens in new tab, where editor can specify reviewer details, form link, and email template (with a default set by community in integration instance settings.
	- Lives on a new service, e.g. reviews.pubpub.org.
	- Service uses `instancedId` from query params to grab default email from PubPub API
	- Service uses `pubId` from query params to pull needed Pub metadata (e.g. title, files to download, etc.)
- Editor starts adding reviewer details: name, email, institution, orcid
	- If user is known by PubPub via email or ORCID or name, they are suggested to editor
		- Service uses autocomplete endpoint
- Editor clicks send out for review.
	- Integration posts users (including all fields) to /email endpoint
	- TODO: consider a framework for tasks/activities rather than a generic email endpoint
	- TODO: consider creating an empty "review" on the pub at this point
	- If user is not known by PubPub, it creates "temporary" users
- Email gets sent to reviewer by PubPub.
	- TBD where the template is defined/compiled
- Integration updates pub status within the workflow to indicate review(s) sent
	- This is stored on the integration instance or as a new kind of metadata on the pub
- Reviewer clicks link to integration service (reviews.pubpub.org/review/pub123/?secret=12345) in email.
- Reviewer has option to accept or decline invitation.
	- Reviewer declines.
		- Integration queries for users and then posts to emails endpoint OR
		- Integration uses dedicated endpoint to tell pubpub to update editors OR
		- Integration updates metadata, and automatically subscribed users are notified by pubpub when that field changes OR
			- Integration manifest defines which statuses pubpub should broadcast changes to
		- PubPub notifies editor.
		- A label on Review interface changes to "review invitation declined"
	- Reviewer accepts	
		- A label on Review interface changes to "review invitation 
		- Reviewer fills out form and submits it.
		- A label on Review interface changes to "review submitted."
		- Admin gets email notification that reviewer has submitted form.

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

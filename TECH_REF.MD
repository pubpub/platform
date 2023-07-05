# Technical Reference


## Synthesis for July 5

**Types and Fields**
Fields are really the ground-truth (as opposed to Types). The fields are consistent and re-used, and the types are just collections of Fields, called a certain name (e.g. Book or Journal). We could let people clone types, but you wouldn't want to exactly re-use the same literal one. Types are really about having control over the type's fields and name on a community-by-community basis. But, the fields being consistent across communities and types means integrations can be simpler.

We will provide a set of base fields (though I can't tell if base fields should be declared somewhere (e.g. a yaml file in code) - or we should have a base type that we create in the UI). I think to start, let's just define them in code. We can introduce the idea of namespacing fields in the future. Ya - for now, we're all just referencing this file when trying to build new types, but in the future it could be more of a 'marketplace' of fields to use and type templates to duplicate.

Fields, Type Templates are what can be shared.
Types are community-owned and community-specific. (We don't want some other community updating a type and having that impact all the other communities). If a template gets updated, maybe we can notify - but that's way down the line. 

Custom fields can be created by just adding them to a community's type? But I'd imagine those custom fields don't show up in an autocomplete - they're local to the community.

**Pubs**
The above is suggesting that all metadata on a pub uses a field described somewhere. They could use the base fields, or it could be a field defined by an integration. Or an integration can add a base field that is not included on the pub's type.

**Workflows and Stages**
Move and Claim are actions that only make sense in the context of Workflows and Stages - they have no bearing on pub metadata. We call them "Workflow Actions"

**Integrations**
Integrations act by reading and writing metadata to pubs. The types of metadata it wants to read and write are declared in its manifest, using known or custom fieldIds. Most integrations will introduce a namespaced metadata field: `reviews-integration/status`. The field can carry an integrationId so that we can know who's status that is, and render it along with buttons, etc provided by the integration.

The integration manifest can provide actions, we call them "Integration Actions". To begin, Integration Actions are exclusively links to another page.

Integrations can be "attached" to a pub, stage, (workflow, or community) — though, they always act on Pubs, not on stages or workflows, etc. The integration doesn't "know" about the pubs beforehand, instead PubPub will render buttons on pubs that, when clicked, send a request to the integration with pubId, instanceId, etc, and the integration can then act on that pub. 
  - PubPub knows when to 'activate'/render a button/integration for a pub in a given stage because it looks up the pub's stage and the integrations 'attached' to that stage. 
  - PubPub can do permissioning by the same means. Look at the pubId the integration is trying to act on, look at whether the integration has been attached to a pub, or any of the stages it is in. Extends trivially for doing the same if we allow attaching to workflows, community, etc.
  - Integrations can provide default status, so that button text/links can be rendered before any integration metadata is set by the integration.
*Proposed idea*: There are no "webhooks" or automatic integrations to begin. Everything is click-based. We can get into auto-clicking (e.g. Triggers) in the future. Integrations don't "listen" - they just respond to requests to specific URLs they declare in the manifest.
  - In a future where there are Triggers, I think this could remain true. PubPub is just responsible for doing the 'clicking' automatically based on stage movement/cron/etc, but the integration doesn't know or care about the difference.
  - One way to think about this is that Integrations are essentially 'functions' (they could have state, so I don't want to say 'functional'), they are explicitly called, and produce some side effect: metadata change (aka internal side effect) or external side effect.
  
**API endpoints**
- read and write pub metadata
- read pubpub users
- send transactional email to user (we want this to go through PubPub so we don't have to reveal user emails to 3rd parties)

- Endpoints I don't think we need
  - read stage/workflow information
    - Is that right? Is there any reason an integration would need to know about a pub's current stage? I think not...
  - trigger workflow actions (i.e. Move, Claim)

Workflow action clicks will send along `pubId` and `instanceId` (and maybe a `accessHash` if we want to do permissioning that way? Eh - we could validate directly more easily I think, then no risk of stale accessHashes/leaks). This allows the integration to persist settings per-instance and query/write pub metadata.

**Core PubPub**
With the description of Integrations, there is a concept of 'Core PubPub' - which is just the minimal set of functionality PubPub provides and clear boundaries about when something should be handled by an Integration.

Core PubPub could essentially be: Fields + Types, Pubs + Metadata, Workflows + Stages, Integrations API.

The appeal of this is keeping a relatively simple codebase and stack with a very specific set of functionality that does not need to expand into overwhelming complexity over time (as happened in v6). New, bespoke needs are handling by building new Integrations.


### Glossary
- **Community** - The top level organizational unit. Allows people to group Pubs, Members, Workflows, Integrations, and Types within a single permissions structure. Typically will be scoped to a single "billing department" (i.e. an organization or person would not need multiple communities like they do in v6).
- **Pub** - A collection of metadata that represents a conceptual work — i.e. A book may have multiple formats, files, cover arts, etc but it's still the same book conceptually. 
- **Metadata** - A key-value pair that describes a certain aspect of a Pub.
- **Metadata Field (aka Field)** - The key of a metadata key-value pair.
- **Metadata Value (aka Value)** - The value of a metadata key-value pair.
- **Pub Type (aka Type)** - A list of Fields that a Pub could have. 
- **Pub Type template [Not part of MVP]** - A list of Fields that you may want to repeatedly use in the creation of multiple different Pub Types.
- **Workflow** - A set of unordered stages that help for the Members of a Community organize and describe the process used to to modify the Metadata of Pubs.
- **Stage** - A step in a Workflow, typically understood to be focused around a specific group of people modifying a specific set of Metadata Values on specific Pubs. 
- **Integration** - A web UI/process that aids in the modification of a Pub's Metadata, or in the creation of external processes based on Pub Metadata.
- **Integration manifest (aka manifest)** - A file in our codebase that registers an Integration's set of Fields, Integration Actions, and other static configuration.
- **Integration instance (aka instance)** - A particular invocation of an Instance in a given Community for a given set of Pubs. Multiple instances of the same Integration may be used in the same Community if a configuration with different settings or set of Pubs is desired (e.g. building two websites from two different Pubs, or having two different Crossref memberships that they wish to use).
- **Integration status** - Metadata set by an Integration on a Pub that communicates the status of that Integration for that given Pub. Will be set on a namespaced Metadata Field (e.g. `reviews-v1-integration/status`).
- **Side-effect** - The result of an Integration's action - could be Internal or External.
- **Internal side-effect** - The change of Metadata Values by an Integration.
- **External side-effect** - Some off-platform event produced by an Integration, e.g. a built website, a tweet, or a printed book.
- **Action** - The buttons rendered on a Pub that allow Members of a Community to act on it.
- **Workflow action** - Actions (buttons) that effect a Pub's location and status in a Workflow. Hardcoded, at the moment just `Move` (between Stages) and `Claim`.
- **Integration action** - Actions (buttons) that are dynamically available on a Pub based on the Integrations configured within a Community. For example, 'Review', 'Publish Site', 'Issue DOI'.
- **Trigger [Not part of MVP]** - Processes that automatically 'click' Integration Actions based on some set of conditions configured by the Community. For example, automatically registering a DOI when a Pub arrives at a certain stage, automatically building a website every 24 hours, etc, automatically issuing Review emails when a Pub has a non-null title and a PDF file.


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

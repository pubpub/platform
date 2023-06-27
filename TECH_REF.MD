# Technical Reference


## For Next Time
### Review
- Let's "build" our first integration

## Monday Jun 26, 2023

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

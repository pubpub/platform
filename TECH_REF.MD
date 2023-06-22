# Technical Reference

## For Next Time
- Review and confirm our workflow terminology:
  - Workflow actions: do not modify Pub metadata
  - Internal side effects: modify Pub metadata, but directly in the app
  - External side effects: modify Pub metadata, but via an integration
- How do we handle internal and external side effects?

## Thursday, June 22, 2023

### Pub Tables
- Existence of a field on a pub is sufficient validation for PubTypes for the MVP -- both for integrations and stages.
- EAV vs. JSONB: going to maintain both for now so we can look into performance as we build.

### Workflows
- Integrations can be connected to any stage.
- Workflow stage actions generally shouldn't change Pub metadata — Pub metadata should be changed in side effects or integrations.

## Wednesday, June 21, 2023

### Pub Types
- Pub types have flexible definitions, which should be editable by users — even if user is just us at the beginning.
- Pub values are declared and stored elsewhere, not on the Pub model.
- Pub types are defined in the db. We may build a UI for adding types, but initially it will likely be us, the community team, or power users.
- The types a Pub satisfies are calculated when the Pub's metadata is modified (or when a Pub type is modified) for downstream integrations and other UI components.

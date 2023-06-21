# Technical Reference

## Wednesday, June 21, 2023

### Pub Types
- Pub types have flexible definitions, which should be editable by users — even if user is just us at the beginning.
- Pub values are declared and stored elsewhere, not on the Pub model.
- Pub types are defined in the db. We may build a UI for adding types, but initially it will likely be us, the community team, or power users.
- The types a Pub satisfies are calculated when the Pub's metadata is modified (or when a Pub type is modified) for downstream integrations and other UI components.

# PubPub Integrations

The home for all first-party PubPub integrations, along with templates and packages that assist in the creation of integrations.

## Integrations

Below is the list of official integrations currently available on PubPub.

| Name                                                 | Description                                          |
|------------------------------------------------------|------------------------------------------------------|
| [pubpub-integration-datacite](integrations/datacite) | Create DOIs for Pubs using the DataCite API          |
| [pubpub-integration-editor](./)                      | (WIP) Draft and edit Pub content in Rich Text format |
| [pubpub-integration-review](./)                      | (WIP) Solicit structured feedback on Pubs            |

## Packages

### [@pubpub/integration-sdk](packages/integration-sdk)

JavaScript (Node and browser) utilities that make building PubPub integrations easier.

## Templates

Each template in this repo uses:
- [@pubpub/integration-sdk](packages/integration-sdk) for styles and PubPub utilities
- [Express](https://expressjs.com) for static files, pages, and API endpoints

### [word-counts](templates/word-counts)

A fast and lean integration template with minimal development overhead. Build your integration with with declarative, reactive HTML.

Dependencies:
- [Eta](https://eta.js.org) for HTML templating
- [Alpine](https://alpinejs.dev) for UI interactivity

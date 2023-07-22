# PubPub Integrations

The home for all first-party PubPub integrations, along with templates and packages that assist in the creation of integrations.

## Integrations

Below is the list of official integrations currently available on PubPub.

| Name                              | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| [datacite](integrations/datacite) | Create DOIs for Pubs using the DataCite API          |
| [editor](./)                      | (WIP) Draft and edit Pub content in Rich Text format |
| [review](./)                      | (WIP) Solicit structured feedback on Pubs            |

## Packages

### [@pubpub/integration-sdk](packages/integration-sdk)

JavaScript (Node and browser) utilities that make building PubPub integrations easier.

## Templates

Each template in this repo uses:

- [@pubpub/integration-sdk](packages/sdk) for styles and PubPub utilities
- [Express](https://expressjs.com) for static files, pages, and API endpoints

### [alpine](templates/alpine)

A lean integration template. Build your integration with with declarative, reactive HTML. No framework or build step required.

Dependencies:

- [Eta](https://eta.js.org) for HTML templating
- [Alpine](https://alpinejs.dev) for UI interactivity

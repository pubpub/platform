<img src="./core/app/icon.svg" width="32px">

# PubPub Platform

_Our open-source technology for creating full-stack knowledge infrastructure for communities of all types._

As noted in [our announcement](https://www.knowledgefutures.org/updates/pubpub-platform/), Knowledge Futures has been hard at work on PubPub Platform, a centrally hosted tool that allows groups to customize their workflow and their publishing outputs, including various file types and applications. We think this will be a major improvement for communities that want more flexibility, customization, and the ability to self-host. We invite you to install the alpha version of PubPub Platform and we welcome your feedback. 
**This is definitely a testing version, and not ready for production communities.** 

## Development

This repo is built as a monorepo that holds first-party components of PubPub. There are three primary sections:

```
root
├── core/
├── integrations/
├── packages/
└── ...
```

-   `core` holds the primary app that is hosted on `app.pubpub.org`.
-   `integrations` (deprecated) holds the integrations developed by the PubPub team. 3rd party integrations may be developed and hosted elsewhere.
-   `packages` holds libraries and npm packages that are used by `core`, `integrations`, and 3rd party integration developers.

To avoid inconsistencies and difficult-to-track errors, we specify a particular version of node in `/.nvmrc` (currently `v20.17.0`). Please use [nvm](https://github.com/nvm-sh/nvm) to ensure you're using the same version.

All following commands are run from the root of this package.

To get started, run:

```
pnpm install
pnpm build
```

Running build when getting started with this repo is important to make sure the any prebuild scripts run (e.g. Prisma generate).

Depending on which app or package you are doing work on, you may need to create a .env.local file. See each package's individual README.md file for further details.

To run all packages in the monorepo workspace, simply run:

```
pnpm dev:setup
pnpm dev
```

Often, you'll only want to run a specific package's dev script. In that case, use pnpm [filters](https://pnpm.io/filtering):

```
pnpm dev --filter core    // Runs just the `core` packages dev script
pnpm dev --filter core... // Runs just the `core` package and its dependencies dev scripts
```

Note that the term following `--filter` is the name of the package as specified in `package.json`, not the folder name (even though those may sometimes be identical).

You can also use [filters](https://pnpm.io/filtering) to run package-specific commands, by placing the `--filter` flag before the script name:

```
pnpm --filter core reset
pnpm --filter core migrate-dev
```

*Additional development information can be found [here](https://github.com/knowledgefutures/pubpub/blob/main/development.md).

## Bugs, Feature Requests, Help, and Feedback

If you have a specific bug to report, feel free to add a [new issue](https://github.com/knowledgefutures/pubpub/issues/new/choose) to the PubPub Platform Repo. Please search the [issue list](https://github.com/knowledgefutures/pubpub/issues) first to make sure your bug hasn't already been reported. If it has, add your feedback to the preexisting issue. For new bug reports, please fill out all the applicable parts of the bug report template before submitting.

If you have a feature request, idea, general feedback, or need help with PubPub, we'd love you to post a discussion on the [PubPub Forum](https://github.com/knowledgefutures/pubpub/discussions). As with bug reports, make sure to search the forum first to see if the community has already discussed your idea or solved your issue. If we have, feel free to join in on that ongoing discussion. Remember to be polite and courteous. All activity on this repository is governed by the [Knowledge Futures Code of Conduct](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md).

## Contributing

At the moment, PubPub isn't particularly well setup for outside contributors. However, we'd like to get to that point, and if there's a specific feature or idea from [our roadmap](https://github.com/orgs/pubpub/projects/9) or [issue list](https://github.com/pubpub/pubpub) that you're interested in working on, we'd like to hear from you. Please send a note to [hello@pubpub.org](mailto:hello@pubpub.org?subject=Code%20Contribution) introducing yourself and describing how you'd like to contribute.

## User-Facing Documentation

User-facing documentation is a work in progress, and can be found at https://help.pubpub.org. 

## Supporting Services

Thank you to these groups for providing their tools for free to PubPub's open source mission.

[![Browserstack-logo@2x](https://user-images.githubusercontent.com/1000455/64237395-318a4c80-cef4-11e9-8b78-98ed3ec58ce3.png)](https://www.browserstack.com/)

## Code of Conduct

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md)

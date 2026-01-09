<img src="./core/app/icon.svg" width="32px">

# PubPub Platform

_Open-source technology for creating full-stack knowledge applications for communities of all types._

As noted in [our recent announcement](https://www.knowledgefutures.org/updates/pubpub-platform/), Knowledge Futures has been hard at work on PubPub Platform, a tool that allows communities of all kinds to build knowledge applications tailored to their needs. We believe PubPub platform offers a major improvement for communities that want more flexibility, customization, and the ability to either use centralized hosting or self-host, while keeping the experimental, easy-to-use philosophy that Knowledge Futures has always strived for. We invite you to install and explore the alpha version of PubPub Platform, and we welcome your feedback.

Learn More:
[Documentation](https://help.knowledgefutures.org) | [PubPub Platform](https://knowledgefutures.org/pubpub) | [Knowledge Futures](https://www.knowledgefutures.org/) | [Newsletter](https://pubpub.us5.list-manage.com/subscribe?u=9b9b78707f3dd62d0d47ec03d&id=be26e45660) | [Roadmap](https://github.com/orgs/pubpub/projects/46/views/1)

**PubPub Platform is currently an alpha release, which means the code is subject to frequent, breaking changes. We do not yet recommend running PubPub Platform for production projects.**

## Community Guidelines and Code of Conduct

Knowledge Futures intends to foster an open and welcoming environment that aligns with our [core values of ACCESS](https://notes.knowledgefutures.org/pub/cqih29xa#our-values-access) (accessibility, collaboration, curiosity, equity, and systemic outlook). As such, we require that all employees and members of our open-source community adhere to our [Code of Conduct](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md) in all interactions in this and other Knowledge Futures repositories, including issues, discussions, comments, pull requests, commit messages, code, and all other messages.

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md)

## Repository Structure

This repo is built as a monorepo that holds first-party components of PubPub. There are four primary sections:

```
root
├── core/
├── infrastructure/
├── jobs/
├── packages/
└── ...
```

- `core` holds the primary web application.
- `infrastructure` holds the deployment infrastructure for the centrally hosted version of PubPub Platform run by the Knowledge Futures team.
- `jobs` holds the job queueing and scheduling service used by `core`.
- `packages` holds libraries and npm packages that are shared by `core`, `jobs`, and `infrastructure`.

To avoid inconsistencies and difficult-to-track errors, we specify a particular version of node in `/.nvmrc` (currently `v22.13.1`). We recommend using [nvm](https://github.com/nvm-sh/nvm) to ensure you're using the same version.

## Local Installation

This package runs the version of node specified in `.nvmrc` (currently `v22.13.1`) and uses pnpm for package management. All following commands are run from the root of this package.

To get started, clone the repository and install the version of node specified in `.nvmrc` (we recommend using [nvm](https://github.com/nvm-sh/nvm).

Next, [install pnpm](https://pnpm.io/installation) (likely using npm via `npm install -g pnpm`).

Then, from the root of the repository, run:

```
pnpm install
pnpm build
```

**Running build when getting started with this repo is important to make sure the any prebuild scripts run**

Depending on which app or package you are doing work on, you may need to create a .env.local file. See each package's individual README.md file for further details.

## Development

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

## Self-Hosting and Deployment

Documentation for self-hosting is available in the [self-host directory](https://github.com/pubpub/platform/blob/main/self-host/). We will be adding documentation and templates for deploying it to common platforms soon. If you'd like to submit a guide, or have us to develop one for your platform of choice, let us know in the [Discussion Forum](https://github.com/pubpub/platform/discussions).

## Bugs, Feature Requests, Help, and Feedback

We use the [Discussion Forum](https://github.com/pubpub/platform/discussions) for feature requests, ideas, and general feedback, and [GitHub Issues](https://github.com/pubpub/platform/issues/) for day-to-day development. Thus, if you're unsure where to post your feedback, start with a discussion. We can always transfer it to an issue later if needed.

### Bugs

If you have a specific bug to report, feel free to add a [new bug issue](https://github.com/pubpub/platform/issues/new?assignees=&labels=bug&projects=&template=bug-issue.md&title=) to the PubPub Platform Repo. If you submit a bug, we ask that you use the available template and fill it out to the best of your ability, including information about your browser and operating system, detailed, written step-by-step instructions to reproduce the bug and screenshots or a screen recording when relevant. Having all of this information up-front helps us solve any issues faster.

Please search the [issue list](https://github.com/pubpub/platform/issues) first to make sure your bug hasn't already been reported. If it has, add your feedback to the preexisting issue as a comment.

### Feature Requests, Feedback, and Help

If you have a feature request, idea, general feedback, or need help with PubPub, we'd love you to post a discussion on the [Discussion Forum](https://github.com/pubpub/platform/discussions). As with bug reports, make sure to search the forum first to see if the community has already discussed your idea or solved your issue. If we have, feel free to join in on that ongoing discussion. Remember to be polite and courteous. All activity on this repository is governed by the [Knowledge Futures Code of Conduct](https://github.com/knowledgefutures/general/blob/master/CODE_OF_CONDUCT.md).

## Contributing

In the coming weeks, we'll be developing more thorough contribution guides, particularly for contributors interested in:

- Extending PubPub Platform with new Actions and Rules
- Extending the PubPub Platform API
- Contributing to self-hosting scripts and guides on common cloud hosting
- Contributing documentation for developers or users

For now, you can browse the [issue list](https://github.com/pubpub/platform/issues) and comment on any issues you may want
to take on. We'll be in touch shortly

### Pull Requests

Our preferred practice is for contributors to create a branch using the format `initials/descriptive-name` and submit it against main.

Request names should be prefixed with one of the following categories:

- fix: for commits focused on specific bug fixes
- feature: for commits that introduce a new feature
- update: for commits that improve an existing feature
- dev: for commits that focus solely on documentation, refactoring code, or developer experience updates

Request descriptions should use to our Pull Request template, including a clear rationale for the PR, listing any issues resolved, and describing the test plan for the request, including both tests you wrote and step-by-step descriptions of any manual QA that may be needed.

Finally, we request that any complex code, new terminology, potentially decisions you made, or any areas you'd like feedback on be commented on inline in GitHub's files changed interface.

## User-Facing Documentation

User-facing documentation is a work in progress, and can be found at https://help.knowledgefutures.org.

## Supporting Services

Thank you to these groups for providing their tools for free to PubPub's open source mission.

[![Browserstack-logo@2x](https://user-images.githubusercontent.com/1000455/64237395-318a4c80-cef4-11e9-8b78-98ed3ec58ce3.png)](https://www.browserstack.com/)

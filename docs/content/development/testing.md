# Running tests (in `core`)

1. clone the repo
2. install Playwright Test for VSCode plugin (should be recommended)
3. `pnpm -w dev:setup` (TIL: -w lets you run things from the root without actually being in the root!)
4. Click on extension (test tube icon), click on refresh button, `core` tests should appear
    - you might see an error to install `@playwright/test` but you can ignore this
    - (20250605) The `context-editor` tests currently do not show up here.
5. Start your dev server via `pnpm dev at root`
    - This makes sure `core` and `jobs` are both up, which is needed for some for all playwright tests to pass)
6. Now you should be able to either run a test from the testing panel, or directly inside a test
7. You will need to install the playwright browsers—a notification in vscode should pop up and let you do so
8. Try running again. You should see the test go through the steps and pass!
9. Running all tests at once via VS code will likely fail against the dev server, but should be okay against the built server
10. We recommend running individual tests against the dev server
11. For the CLI: `pnpm run playwright:test`
12. currently, data seeded into playwright doesn't add all@pubpub.org which is why if you are logged in you won't see the seeded playwright data. it's sometimes useful to be able to see the playwright community in your dev server—in this case you'd have to log in as the user in the seed community
13. `pnpm playwright:test path/to/test` or `pnpm playwright:test 'playwright/actions\*'` to run individual/groups of tests
14. Can debug via breakpoints in vs code + either
    - right click test and select "Debug test"
    - or, in the sidebar, clicking the debug icon next to the test
15. can use `playwright:test 'path/to/test' -- --debug` (note the extra `--`) if you are running from the CLI
    - here you can also use `await page.pause()` to pause the test at a specific point
16. Checking the "Show trace viewer" checkbox on 'Settings' in the extension is also very helpful to see the UI while the test is running

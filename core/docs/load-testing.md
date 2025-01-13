# Load Testing

Firstly, [install Artillery](https://www.artillery.io/docs/get-started/get-artillery).

```sh
npm install -g artillery@latest
```

Optional: set the environment variable `ARTILLERY_CLOUD_API_KEY` to your [Artillery Cloud API](https://app.artillery.io/login) key. This is only needed in order for the results to report to Artillery Cloud.

Run the load tests against our production environment from your machine with the following command:

```sh
pnpm --filter=core load-test
pnpm --filter=core load-test --report # send test metrics to Artillery Cloud in real time
```

This command will spawn many virtual users (vusers) that interact with the production application by performing a series of pre-configured tasks. The number of vusers starts small and slowly ramps up until the test reaches a "spike phase" which simulates a sudden and large increase in traffic.

Currently each vuser visits the `/forgot` and `/login` pages before it is terminated. The tests will soon use select tests from our end-to-end test suite to simulate more realistic user behaviors.

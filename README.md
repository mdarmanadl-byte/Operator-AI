# Operator AI

Operator AI is an AI-powered task execution system. A user submits an
instruction, the planner turns it into an ordered execution plan,
registered tools carry out the steps, and the runtime records task
status, execution events, results, and verification evidence.

## Features

-   **Task management:** Create tasks, list tasks, inspect task details,
    and view execution events.
-   **LLM-based planning:** Generate a structured plan from a
    natural-language instruction, with validation against registered
    tools.
-   **Tool registry:** Select from tools registered with the agent.
-   **Sequential execution:** Execute planned steps in order.
-   **Retry and verification:** Retry failed steps within the configured
    attempt limit and verify tool results.
-   **Cancellation:** Request cancellation of task execution.
-   **Execution evidence:** Store task events and tool evidence to help
    inspect what happened.
-   **Demo CRM browser automation:** Use Playwright to interact with the
    local demo CRM.
-   **Calculator tool:** Perform and verify supported arithmetic
    operations.
-   **Persistence:** Store tasks and task events in PostgreSQL through
    Prisma.

## Project structure

``` text
backend/
├── prisma/                 # Prisma schema and migrations
├── public/
│   └── demo-crm.html        # Local CRM demo used by browser automation
├── src/
│   ├── agent/
│   │   ├── planner.ts       # Creates and validates execution plans
│   │   ├── runtime.ts       # Runs plans and coordinates task state
│   │   ├── executor.ts      # Executes steps, retries, and verifies results
│   │   ├── verifier.ts      # Tool-result verification
│   │   ├── tool-registry.ts # Agent tool contracts and registry
│   │   └── tools/           # Calculator and browser tools
│   ├── controllers/         # HTTP controllers
│   ├── routes/              # Express routes
│   ├── services/            # Task, execution, and event services
│   ├── tools/               # CRM tools and application tool registry
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
└── tsconfig.json

frontend/
└── Next.js dashboard (kept in its own frontend directory)
```

> The paths above describe the backend archive and the separately
> maintained Next.js frontend. If your local folder names differ, use
> your actual project paths.

## Requirements

-   Node.js and npm
-   PostgreSQL database
-   An API key for the configured LLM provider
-   Playwright's Chromium browser for the browser automation tool

## Configuration

Create or update `backend/.env` with your local values:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3000

LLM_PROVIDER=groq
LLM_API_KEY=your_llm_api_key
LLM_MODEL=your_supported_model_name
LLM_BASE_URL=your_provider_base_url

# Optional: override the default local demo CRM URL
CRM_DEMO_URL=http://localhost:3000/demo-crm.html
```

Use the provider, model, and base URL that match your current working
LLM configuration. Never commit real API keys, database passwords, or
other secrets to source control.

## Run the backend locally

From the backend directory:

``` bash
npm install
npx prisma generate
npx prisma migrate deploy
npx playwright install chromium
npm run dev
```

For a new local development database where migrations have not yet been
applied, use the Prisma migration workflow already used by your project
rather than `migrate deploy` if you need to create a new migration.

The API server uses the `PORT` value from `.env`; the examples below
assume port `3000`.

## Run the frontend locally

From the Next.js frontend directory, create `.env.local`:

``` env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Set this to the actual API prefix configured by your backend. Then run:

``` bash
npm install
npm run dev
```

Open the local URL printed by Next.js in your terminal.

## API endpoints

The task router exposes the following endpoints under the API prefix
configured in `src/app.ts`:

  -------------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -------------------------
  `POST`                  `/tasks`                Create a task. Expected
                                                  body:
                                                  `{"instruction":"..."}`

  `GET`                   `/tasks`                List tasks

  `GET`                   `/tasks/:id`            Get one task

  `POST`                  `/tasks/:id/execute`    Start task execution

  `POST`                  `/tasks/:id/cancel`     Request task cancellation

  `GET`                   `/tasks/:id/events`     Retrieve task execution
                                                  events
  -------------------------------------------------------------------------

The frontend's `NEXT_PUBLIC_API_URL` should include the API prefix, for
example `http://localhost:3000/api/v1`, if that is how `src/app.ts`
mounts the routes.

## Example instructions

Examples supported by the registered tools include:

``` text
Calculate 39 * 5
Mark contact Alex Carter as qualified
Search contacts
```

The browser tool uses the local Demo CRM page. Start the backend and
make sure the configured `CRM_DEMO_URL` points to a reachable demo CRM
page before testing browser actions.

## Tests

Run the test suite from the backend directory:

``` bash
npm test
```

Run a one-time test pass with Vitest:

``` bash
npx vitest run
```

Build the TypeScript backend:

``` bash
npm run build
```

A passing application run does not replace running the tests. Check the
actual command output to determine which tests pass or fail in your
current checkout.

## Task lifecycle

At a high level, the application:

1.  Accepts and stores the user's task instruction.
2.  Builds and validates a plan using the configured LLM and registered
    tools.
3.  Executes the planned steps sequentially.
4.  Retries eligible step failures within the configured attempt limit.
5.  Verifies tool results.
6.  Records task events, output, and evidence for inspection.
7.  Supports cancellation through the task API.

## Troubleshooting

-   **LLM request fails:** Verify `LLM_PROVIDER`, `LLM_API_KEY`,
    `LLM_MODEL`, and `LLM_BASE_URL` against your current provider
    configuration.
-   **Database connection fails:** Verify `DATABASE_URL`, ensure
    PostgreSQL is running, and confirm migrations have been applied.
-   **Prisma client errors:** Run `npx prisma generate` after installing
    dependencies or changing the schema.
-   **Browser tool cannot open the CRM:** Ensure Chromium is installed
    and `CRM_DEMO_URL` points to a reachable page. Check whether the
    demo page is being served at the configured URL.
-   **Frontend cannot reach the API:** Check that the backend is
    running, the API prefix in `NEXT_PUBLIC_API_URL` is correct, and
    CORS is configured for the frontend origin.
-   **Task planning fails:** Check the LLM configuration and confirm
    that the planner's selected tool names and instructions match
    registered tool capabilities.

## Security notes

-   Keep `.env` and `.env.local` out of version control.
-   Use least-privilege credentials for external services.
-   Treat browser actions and other mutations as consequential
    operations.
-   Review logs and execution evidence before relying on an automated
    action.

## Status

This README documents the project structure and intended local workflow.
Confirm commands, environment values, and test results against the
current local checkout before presenting them as verified.

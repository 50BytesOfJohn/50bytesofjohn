---
title: 'Sending Effect logs to PostHog (via OTLP)'
description: 'Are you wondering how you can use your Effect logger and send logs to PostHog? Well… I was too, and here’s how I did it.'
pubDate: 'Apr 29 2026'
---

Is it the best approach ever? Who knows? But it works.

PostHog accepts OpenTelemetry logs, so I decided not to overcomplicate things and just use the Effect's OT package.

This shows a tiny example of how you can set it up and get started.

## Install Deps

```shell
bun add effect @effect/opentelemetry @effect/platform
```

## Config

In the example, we use simple AppConfig to provide the API key and other stuff to our logger.

```typescript
// config.ts
import { Config, LogLevel } from "effect"

export const AppConfig = Config.all({
  posthogUrl: Config.string("POSTHOG_OTLP_URL").pipe(
    Config.withDefault("https://us.i.posthog.com/i/v1/logs"),
  ),
  posthogApiKey: Config.redacted("POSTHOG_API_KEY"),
  logLevel: Config.logLevel("LOG_LEVEL").pipe(
    Config.withDefault(LogLevel.Info),
  ),
})
```

`Config.logLevel` parses values like `"Debug"`, `"Info"`, `"Error"` into a real `LogLevel`, so you can change verbosity per environment without code changes.

> **Tip.** In a real app, you may want to have the PostHog config object separately and use the nested for `POSTHOG` prefix to leverage effect benefits.

## The logger layer

`OtlpLogger.layer` builds an Effect `Logger` that batches log records and POSTs them as OTLP-JSON. It needs two collaborators:

- `OtlpSerialization.layerJson` encodes records into the OTLP wire format.
- `FetchHttpClient.layer` the HTTP client used to call PostHog.

We resolve `AppConfig` first, then build the layer with the values it produced. `Layer.unwrapEffect` is the idiomatic way to build a layer that depends on an effectful computation (here: reading config).

```typescript
// logger.ts
import { FetchHttpClient } from "@effect/platform"
import { OtlpLogger, OtlpSerialization } from "@effect/opentelemetry"
import { Effect, Layer, Logger, Redacted } from "effect"
import { AppConfig } from "./config"

export const PostHogLoggerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { posthogUrl, posthogApiKey, logLevel } = yield* AppConfig

    return Layer.mergeAll(
      Logger.minimumLogLevel(logLevel),
      OtlpLogger.layer({
        url: posthogUrl,
        headers: {
          Authorization: `Bearer ${Redacted.value(posthogApiKey)}`,
        },
        resource: {
          serviceName: "my-service",
          serviceVersion: process.env.APP_VERSION,
        },
      }),
    )
  }),
).pipe(
  Layer.provide(OtlpSerialization.layerJson),
  Layer.provide(FetchHttpClient.layer),
)
```

A few details worth knowing:

- `Logger.minimumLogLevel` filters at the source, so anything below the configured level never gets serialized or sent.
- `OtlpLogger.layer` _adds_ a logger; the default pretty console logger keeps running. Pass `replaceLogger` if you want PostHog to be the only sink.
- Records are batched (default 1 s / 1000 records). The layer is scoped—the batch is flushed and the HTTP client is closed cleanly when the program exits.

## Wire it into your program

```typescript
// main.ts
import { Effect } from "effect"
import { NodeRuntime } from "@effect/platform-node"
import { PostHogLoggerLive } from "./logger"

const program = Effect.gen(function* () {
  yield* Effect.log("worker started")

  yield* Effect.logInfo("processing job").pipe(
    Effect.annotateLogs({ jobId: "job_123", userId: "usr_abc" }),
  )
})

program.pipe(
  Effect.provide(PostHogLoggerLive),
  NodeRuntime.runMain,
)
```

`Effect.annotateLogs` attaches structured attributes that land on the OTLP record as `attributes`, which PostHog displays as filterable fields.

## What PostHog sees

PostHog will get the service name correctly, fiberId, the message, and the attributes you added with annotateLogs.

That's it. Now you can improve it and customize it to your needs, but you should have a basic understanding of how to use PostHog logs with Effect TS.

Thanks, and good luck with your project!

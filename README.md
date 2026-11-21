# Log Deva

This is the README file for Log Deva, a component of the Deva system.

Log Deva is a component of the Deva system designed to handle logging and event tracking. It provides functionalities for logging various events and actions within the Deva ecosystem. With Log Deva, you can easily track and monitor the activity and progress of your Deva agents. It offers listeners for question, ask, and answer events, allowing you to capture and log important information.

## Overview
Log Deva is designed to handle logging and event tracking within the Deva ecosystem. It provides functionalities for logging various events and actions that occur within the system.

install: `npm i @indra.ai/deva.log --save`

usage: 
```js
import log from '@indra.ai/deva.log';
```

## Requirements

- Node.js with npm. Log Deva's `package.json` sets no `engines`. Deva Core 1.67.8 declares `"node": ">=22"` and `"npm": ">=9.5.1"` in its own `package.json`.
- A project with `"type": "module"` in its `package.json`. Log Deva is an ES module.
- `@indra.ai/deva` `^1.67.8` (Deva Core) and `mongodb` `^6.1.0`. Both install with Log Deva.
- A MongoDB server if you want the logs saved. A local `mongod` at `mongodb://127.0.0.1:27017` is enough.

## Two licenses

A running Deva carries two separate licenses, and each is checked on its own.

- **The core license** comes through the client data as `client.VLA`. Deva Core checks it against the core package's VLA at the start of `init`.
- **The agent license** comes through the license feature data as `features.license.devas.log`. Deva Core 1.67.8 checks it against the VLA in Log Deva's own `package.json` right after the features load and before `onInit`. Log Deva has no `onInit` of its own, so it has no license check of its own to change or remove.

The agent check compares the sha256 of the whole VLA object, so every field has to match exactly.

## Configuration

Log Deva reads two features from the client you pass to `init()`. The feature data loader puts them in the client, and Deva Core loads them into the Deva at startup, so both must be there before `init()` runs.

```json
"features": {
	"license": {
		"concerns": [],
		"global": [],
		"devas": {
			"log": {
				"uid": "50322929256393520124",
				"time": 1795221712972,
				"iso": "2026-11-21T00:41:52.972Z",
				"utc": "Sat, 21 Nov 2026 00:41:52 GMT",
				"date": "Friday, November 20, 2026 - 4:41:52 PM",
				"license": "34948472480559228528",
				"fingerprint": "HWA3wRnWj6us9+DFsK9JK3LP2R250C4iS7puNa+WMRY=",
				"client": "27l9CQgHobrMikrhkiVH3N6A2GYIwOT/TBGhygYgf5k=",
				"agent": "nJCa4yJAQOLtusCoXpoJVQa2S+xlRmvhM8sH6OGitmU=",
				"machine": "DBbSJYoWSzinxR+Kc/RVauFEWkhuAR7uNc1TFUwGIHw=",
				"core_hash": "1kUD+ES1UUYRhyVI1ZBpfQt/fZit44Z8/H1UkYAEnnw=",
				"status": "vedic",
				"warning": "⚡️ Deva declares UNLAWFUL USE, MODIFICATION, INSTALLATION, DUPLICATION, DISTRIBUTION, INTERACTION, or IMPLEMENTATION constitutes VEDIC SAHASA a CRIME of the HIGHEST DEGREE. A FINE amounting to 1000 PANAS (1 pana = 3.5 grams of gold) for each INSTANCE has been ORDAINED the PUNISHMENT for SAHASA of the HIGHEST DEGREE.",
				"notice": "Any USE or INTERACTION with Deva constitutes YOUR EXPLICIT CONSENT and AGREEMENT to be GOVERNED according to the LAWS of the 🕉VEDIC RELIGION and 🇺🇸THE UNITED STATES OF AMERICA.",
				"vectors": "#Quinn #QuinnMichaels #InsideTheNet #IndraAI #DEVA #DevaWorld #License #LicenseDeva #VedicLicenseAgreement",
				"owner": "Quinn Michaels",
				"creator": "Quinn Michaels",
				"salute": "🤝🫡🪪🕉🇺🇸",
				"copyright": "Copyright ©2000-2026 Quinn Michaels; All rights reserved.",
				"md5": "PjS0ZaNpEd1ab5PH7J9VGg==",
				"sha256": "KaYxC/Bo6jx1emFDy19SW8/4GDoJH0yZgIreUipc/+k=",
				"sha512": "etdDlGM2j69Fv493+AMrLDWMQ1LjXE7LqIBeBz/Ji5HVa3kpjYc5Z4Rb4CWOSgeb0dIaAgWsiUuXouETW9w0zg=="
			}
		}
	},
	"log": {
		"concerns": [],
		"global": {
			"mongo": {
				"uri": "mongodb://127.0.0.1:27017",
				"database": "LogDeva"
			}
		},
		"devas": {}
	}
}
```

- `license.devas.log` is the agent VLA. It must be the full `VLA` object from this package's `package.json`, as shown above. You can load it from the package, for example:

```js
import pkg from '@indra.ai/deva.log/package.json' with {type:'json'};

const devas = {log: pkg.VLA}; // goes in features.license.devas
```

- `log.global.mongo.uri` is the MongoDB connection string. If it is not set, Log Deva still comes online but builds no MongoDB client, and nothing is saved.
- `log.global.mongo.database` is the database Log Deva writes to.

## Load it

```js
import LogDeva from '@indra.ai/deva.log';

const data = await LogDeva.init(client); // client data provided by your loader
console.log(data.id.uid);
```

When the license checks pass, Log Deva walks start, enter, done and ready. In `onReady` it reads `this.log().global?.mongo`, builds a `MongoClient` in `this.modules.client` when `uri` is set, keeps `database` in `this.vars.database`, and prompts `🪵 Log Deva Ready > VLA:50322929256393520124`.

Log Deva listens on its own event bus. When it is loaded as a child Deva, Deva Core gives it the parent's event bus, so it hears the questions, answers and asks of every Deva on that bus.

To shut it down:

```js
await LogDeva.stop();
```

`onStop` closes the MongoDB client, if there is one, before Deva Core finishes the stop chain.

## When Log Deva refuses to start

If the agent license check fails, Deva Core prompts the message, stops the Deva, and `init()` resolves with that message.

| You see | Why |
| --- | --- |
| `❌ Bad Personal VLA` | `features.license.devas` is there but has no `log` entry. |
| `❌ Invalid VLA Check` | The `log` entry doesn't match this package's VLA, or the license feature has no `devas`. |

A stopped Deva stays stopped. Calling `init()` again on it answers `⭕️ OFFLINE`. To try again, start a new process.

## What it logs

Log Deva has three listeners. Each copies the packet it hears and hands it to `log_write`, which saves it to the collection of the same name. Log Deva doesn't log errors. It leaves them to Error Deva.

| Event | Collection | What is saved |
| --- | --- | --- |
| `devacore:question` | `question` | The question packet, with its `q` built and stamped, from every `question()` call. |
| `devacore:answer` | `answer` | The packet with both `q` and the stamped `a`, from every answer. |
| `devacore:ask` | `ask` | The answer that comes back when one Deva asks another with `#key method`. |

The listeners don't wait on the insert, so a slow database never holds up a question or an answer.

If there is no MongoDB client, `log_write` returns `false` without writing. If the insert fails, it reports the failure through `this.err(e, packet, false)`, so Deva Core talks it once on `devacore:error` for Error Deva to record, and `log_write` returns `false`. Log Deva doesn't listen to `devacore:error`, so a failed insert never loops.

When Log Deva itself errors, its `onError` prompts `💣 ERROR!`, logs the error to the console, and rejects with the original error.

## Inside Log Deva

| Name | Kind | What it does |
| --- | --- | --- |
| `devacore:question` | listener | Calls `this.func.log_write('question', packet)`. |
| `devacore:answer` | listener | Calls `this.func.log_write('answer', packet)`. |
| `devacore:ask` | listener | Calls `this.func.log_write('ask', packet)`. |
| `log_write(type, packet)` | func | Inserts `packet` into the `type` collection of `this.vars.database`. Returns the insert result, or `false` with no client or on failure. |
| `translate`, `parse`, `process` | utils | Each returns its input trimmed. |
| `onReady` | lifecycle | Builds the MongoDB client from the log feature data and prompts the ready message. |
| `onStop` | lifecycle | Closes the MongoDB client, then calls `this.close(data, resolve)`. |
| `onError` | lifecycle | Prompts the error message, logs the error, and returns `reject(err)` or `Promise.reject(err)`. |
| `modules.client` | module | The `MongoClient`, set in `onReady` when a `uri` is given. |

`methods` and `devas` are empty.

The `vars` in `package.json` hold:

- `messages`: the prompt text for `init`, `start`, `enter`, `ready`, `stop`, `exit`, `done` and `error`.
- `ask`: settings carried in the agent data.
- `context`: empty.

`this.vars.database` is set in `onReady` from the log feature data.

## Testing

Start a local MongoDB, then run:

```bash
npm test
```

`npm test` runs `node --test`. The tests use `mongodb://127.0.0.1:27017` by default. To use another server, set `MONGO_URI`:

```bash
MONGO_URI="mongodb://127.0.0.1:27018" npm test
```

The tests always write to their own database, `deva_log_test`, and drop it when they finish. Only the server can change, so the cleanup never touches another database. If MongoDB can't be reached, the four MongoDB tests are skipped with a message and the rest still run.

The tests build a stub client in code from the core VLA in `@indra.ai/deva/package.json` and the VLA in this package's `package.json`, so no client file is needed. They cover:

- log builds as a Deva and waits offline before init
- log data has no placeholders left
- log comes online and walks to ready
- log agent matches the package
- log utils answer with trimmed text
- log help pages name the Deva and carry the package license
- the log feature method signs the packet
- log_write saves a packet to the test database (MongoDB)
- log_write without a database returns false
- a question is written to the question collection (MongoDB)
- a devacore:answer event is written to the answer collection (MongoDB)
- a devacore:ask event is written to the ask collection (MongoDB)
- a failed insert is reported once and log_write answers false
- log stops through the full chain and closes the database
- log refuses to start with a bad agent VLA
- log refuses to start without its agent VLA

The test for `log_write` without a database runs in a child process with a 15 second timeout, so a write that never returns fails that one test instead of holding up the rest. The failed insert test points a fresh Log Deva at a port that refuses connections, so it runs with or without MongoDB.

## Files

| File | What it holds |
| --- | --- |
| `index.js` | The Log Deva. |
| `package.json` | Package info, the package VLA, and the agent and vars data under `data`. |
| `feature/methods.js` | A `log(packet)` feature method that signs the packet with `this.methods.sign('log', 'default', packet)`. |
| `help/main.feecting` | The main help page and the license block. |
| `help/corpus.feecting` | The help corpus. |
| `index.test.js` | The tests. |
| `assets/` | The emoji, avatar, background and main images. |
| `LICENSE.md` | The license. |

Thank you for choosing Log Deva for your logging and event tracking needs. If you have any further questions or need assistance, feel free to reach out.

Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
Owner Signature Required For Lawful Use.  
Distributed under VLA:50322929256393520124 LICENSE.md  
Friday, November 20, 2026 - 4:41:52 PM PST
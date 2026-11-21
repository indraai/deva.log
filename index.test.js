"use strict";
// Log Deva Test File
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:50322929256393520124 LICENSE.md  
// Friday, November 20, 2026 - 4:41:52 PM PST

// run with: npm test
// MongoDB tests use a local server at mongodb://127.0.0.1:27017 by default. Set MONGO_URI to use another one.
// They skip with a message when MongoDB can't be reached.
import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {MongoClient} from 'mongodb';
import Deva from '@indra.ai/deva';
import core from '@indra.ai/deva/package.json' with {type:'json'};
import pkg from './package.json' with {type:'json'};
import feature from './feature/methods.js';
import LOG from './index.js';

const DIR = dirname(fileURLToPath(import.meta.url));
const STAGES = ['start', 'enter', 'done', 'ready'];
const TIERS = ['md5', 'sha256', 'sha512'];
const PLACEHOLDER = /::[a-z-]+::|\{\{profile\.[a-z]+\}\}/;

// test database: the uri can change, the database name is fixed so the after hook only ever drops the test database.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB = 'deva_log_test';
const TEST_ID = `log-test-${Date.now()}`;

// check the server once before the tests are defined so the MongoDB tests can skip cleanly.
const mongo = new MongoClient(MONGO_URI, {serverSelectionTimeoutMS: 2000});
const MONGO_SKIP = await mongo.db('admin').command({ping: 1}).then(
	() => false,
	err => `MongoDB is not reachable at ${MONGO_URI} (${err.message}). Start a local mongod or set MONGO_URI.`
);
if (MONGO_SKIP) console.log(`⏭️ ${MONGO_SKIP}`);

// stub client built in code: the core VLA for the core check, the agent VLA for Log Deva
// and the mongo settings for the log feature.
// agentVLA null leaves features.license.devas empty. useMongo false leaves the log feature without a database.
const client = (agentVLA = pkg.VLA, useMongo = true) => ({
	id: '00000000000000000000',
	key: 'client',
	VLA: structuredClone(core.VLA),
	prompt: {
		emoji: '🧪',
		text: 'client',
		colors: {
			label: {R: 2, G: 229, B: 77},
			text: {R: 2, G: 229, B: 77},
		},
	},
	profile: {
		id: '00000000000000000000',
		name: 'Test Client',
		describe: 'Test client for Log Deva',
		lang: 'en',
		locale: 'en-US',
		currency: 'USD',
	},
	features: {
		license: {
			concerns: [],
			global: [],
			devas: agentVLA ? {log: structuredClone(agentVLA)} : {},
		},
		log: {
			concerns: [],
			global: useMongo ? {mongo: {uri: MONGO_URI, database: MONGO_DB}} : {},
			devas: {},
		},
	},
});

// wait for a listener to write a document, since the listeners don't wait on the insert.
async function findDoc(collection, query, tries = 30) {
	for (let i = 0; i < tries; i++) {
		const doc = await mongo.db(MONGO_DB).collection(collection).findOne(query);
		if (doc) return doc;
		await new Promise(r => setTimeout(r, 100));
	}
	return null;
}

let logClient = false; // Log Deva's own MongoClient, kept so the stop test and the after hook can check and close it.

after(async () => {
	if (!MONGO_SKIP) await mongo.db(MONGO_DB).dropDatabase();
	await mongo.close();
	if (logClient) await logClient.close();
});

test('log builds as a Deva and waits offline before init', async () => {
	assert.ok(LOG instanceof Deva, 'the export is a Deva');
	assert.equal(await LOG.stop(), LOG._messages.offline, 'stop before init answers offline');
});

test('log data has no placeholders left', () => {
	assert.doesNotMatch(JSON.stringify(pkg.data), PLACEHOLDER, 'package.json data');
	assert.doesNotMatch(JSON.stringify(pkg.VLA), PLACEHOLDER, 'package.json VLA');
	assert.doesNotMatch(pkg.copyright, PLACEHOLDER, 'package.json copyright');
});

test('log comes online and walks to ready', async () => {
	const prompts = [];
	LOG.listen('devacore:prompt', packet => prompts.push(packet.text));
	const data = await LOG.init(client());
	for (const k of STAGES) assert.equal(typeof data[k], 'number', `${k} timestamp`);
	assert.ok(data.start <= data.enter && data.enter <= data.done && data.done <= data.ready, 'stages in order');
	assert.equal(typeof data.id.uid, 'string', 'uid');
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `${t} hash`);
	assert.ok(prompts.includes(`${LOG.vars.messages.ready} > VLA:${pkg.VLA.uid}`), 'onReady prompts the ready message');
	assert.ok(LOG.modules.client instanceof MongoClient, 'onReady builds the MongoClient');
	assert.equal(LOG.vars.database, MONGO_DB, 'onReady sets the database');
	logClient = LOG.modules.client;
});

test('log agent matches the package', () => {
	const agent = LOG.agent();
	assert.equal(agent.key, 'log');
	assert.equal(agent.profile.name, 'Log Deva');
	assert.equal(agent.profile.owner, 'Quinn Michaels');
});

test('log utils answer with trimmed text', () => {
	const {translate, parse, process} = LOG.utils;
	for (const util of [translate, parse, process]) assert.equal(util('  hello  '), 'hello');
});

test('log help pages name the Deva and carry the package license', async () => {
	const main = await LOG.help('main', DIR);
	assert.match(main, /^# \{\{profile\.name\}\}$/m, 'main help heading');
	const license = await LOG.help('main:license', DIR);
	assert.match(license, new RegExp(`^uid: ${pkg.VLA.uid}$`, 'm'), 'license uid');
	for (const t of TIERS) assert.ok(license.includes(`${t}: ${pkg.VLA[t]}`), `${t} hash in the license help`);
});

test('the log feature method signs the packet', async () => {
	const calls = [];
	const sign = async (a, b, c) => {
		calls.push([a, b, c]);
		return 'signed';
	};
	const self = {methods: {sign}};
	const packet = {test: TEST_ID};
	assert.equal(await feature.log.call(self, packet), 'signed');
	assert.deepEqual(calls, [['log', 'default', packet]]);
});

test('log_write saves a packet to the test database', {skip: MONGO_SKIP}, async () => {
	const result = await LOG.func.log_write('question', {test: TEST_ID, kind: 'direct'});
	assert.equal(result.acknowledged, true, 'insert acknowledged');
	const doc = await findDoc('question', {_id: result.insertedId});
	assert.equal(doc?.test, TEST_ID, 'the packet reads back');
	assert.equal(doc.kind, 'direct');
});

// runs in a child process with a fresh Log Deva and no database, so a write that never returns
// can be stopped by the timeout instead of holding up the whole test file.
test('log_write without a database returns false', async () => {
	const code = [
		`const {default: LOG} = await import(${JSON.stringify(new URL('./index.js', import.meta.url).href)});`,
		'await LOG.init(JSON.parse(process.env.LOG_TEST_CLIENT));',
		`const result = await LOG.func.log_write('question', {test: 'no database'});`,
		'await LOG.stop();',
		'console.log(`RESULT:${JSON.stringify(result)}`);',
	].join('\n');
	const env = {PATH: process.env.PATH, LOG_TEST_CLIENT: JSON.stringify(client(pkg.VLA, false))};
	const run = promisify(execFile)(process.execPath, ['--input-type=module', '-e', code], {cwd: DIR, env, timeout: 15000, killSignal: 'SIGKILL'});
	const {stdout} = await run.catch(err => {
		const why = err.killed ? 'did not return within 15 seconds' : `failed: ${err.message}`;
		assert.fail(`log_write without a database ${why}`);
	});
	assert.match(stdout, /^RESULT:false$/m, 'log_write answers false');
});

test('a question is written to the question collection', {skip: MONGO_SKIP}, async () => {
	const answer = await LOG.question(`/log ${TEST_ID}`);
	assert.ok(answer.a.text.startsWith(LOG._messages.method_not_found), 'Log Deva has no methods, so the question answers method not found');
	const question = await findDoc('question', {'q.text': TEST_ID});
	assert.ok(question, 'the question document was written');
	assert.equal(question.q.meta.method, 'log');
	for (const t of TIERS) assert.equal(typeof question.q[t], 'string', `${t} hash on the question`);
});

// Log Deva has no methods of its own to answer with, so the test talks the core answer event directly.
test('a devacore:answer event is written to the answer collection', {skip: MONGO_SKIP}, async () => {
	LOG.talk('devacore:answer', {test: TEST_ID, kind: 'answer'});
	const doc = await findDoc('answer', {test: TEST_ID, kind: 'answer'});
	assert.ok(doc, 'the answer document was written');
});

// a real ask needs a second Deva on the same event bus, so the test talks the core ask event directly.
test('a devacore:ask event is written to the ask collection', {skip: MONGO_SKIP}, async () => {
	LOG.talk('devacore:ask', {test: TEST_ID, kind: 'ask'});
	const doc = await findDoc('ask', {test: TEST_ID, kind: 'ask'});
	assert.ok(doc, 'the ask document was written');
});

// stub Error Deva: a minimal parent Deva with Log Deva as its child. Deva Core gives the child the
// parent's event bus when it loads, so the stub's devacore:error listener, set up the same way Error Deva
// sets up its own, hears what Log Deva reports through this.err. Log Deva points at a server that refuses
// connections, so its one insert fails fast with no MongoDB needed.
test('a failed insert is handed to the stub Error Deva once and log_write answers false', async () => {
	const {default: FAIL} = await import('./index.js?insert');
	const caught = [];
	const STUB_VLA = {uid: 'stub-error-deva'};
	const STUB = new Deva({
		info: {id: 'stub-error-deva', name: 'Stub Error Deva', VLA: STUB_VLA, dir: DIR},
		agent: {
			id: 'stub-error-deva',
			key: 'error',
			prompt: {emoji: '🧪', text: 'stub', colors: {label: {R: 2, G: 229, B: 77}, text: {R: 2, G: 229, B: 77}}},
			profile: {name: 'Stub Error Deva'},
		},
		listeners: {
			'devacore:error'(packet) {
				console.error(`🧪 stub Error Deva caught ${packet.value}: ${packet.error.name} ${packet.error.message}`);
				caught.push(packet);
			},
		},
		devas: {log: FAIL},
	});
	const stubClient = client();
	stubClient.features.license.devas.error = STUB_VLA;
	stubClient.features.log.global.mongo.uri = 'mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=300';
	const unhandled = [];
	const onUnhandled = err => unhandled.push(err);
	process.on('unhandledRejection', onUnhandled);
	try {
		await STUB.init(stubClient);
		assert.equal(FAIL.events, STUB.events, 'Log Deva shares the stub Error Deva event bus');
		assert.equal(FAIL.listeners['devacore:error'], undefined, 'Log Deva has no devacore:error listener of its own');
		const packet = {id: `${TEST_ID}-insert`, test: TEST_ID, kind: 'insert'};
		const result = await FAIL.func.log_write('question', packet);
		await new Promise(r => setTimeout(r, 500)); // time for any repeat error or unhandled rejection to show
		assert.equal(result, false, 'log_write answers false');
		assert.equal(caught.length, 1, 'the stub Error Deva caught exactly one error');
		assert.equal(caught[0].value, 'log', 'the error came from Log Deva');
		assert.equal(caught[0].agent.key, 'log', 'the error carries the Log Deva agent');
		assert.equal(caught[0].packet.id, packet.id, 'the error carries the packet that failed');
		for (const t of TIERS) assert.equal(typeof caught[0][t], 'string', `${t} hash on the error`);
		assert.equal(unhandled.length, 0, 'no unhandled rejection');
	} finally {
		process.off('unhandledRejection', onUnhandled);
		await STUB.stop(); // stops Log Deva first, then the stub
	}
});

test('log stops through the full chain and closes the database', async () => {
	let closed = false;
	if (logClient) logClient.once('topologyClosed', () => closed = true);
	const data = await LOG.stop();
	assert.equal(data.key, 'shutdown', 'the chain ends on shutdown');
	assert.equal(data.value, 'log');
	if (!MONGO_SKIP) assert.ok(closed, 'onStop closes the MongoClient');
	const again = await LOG.init(client());
	assert.equal(typeof again.ready, 'number', 'a stopped Deva starts again');
	assert.equal((await LOG.stop()).key, 'shutdown', 'and stops again');
});

// each refusal check loads a fresh Log Deva instance from the same file, so it starts from a clean state.
test('log refuses to start with a bad agent VLA', async () => {
	const {default: REFUSE} = await import('./index.js?refuse');
	const prompts = [];
	REFUSE.listen('devacore:prompt', packet => prompts.push(packet.text));
	const result = await REFUSE.init(client({uid: 'bad'}));
	assert.equal(result, REFUSE._messages.checkVLA, 'init answers with the invalid VLA message');
	assert.ok(prompts.includes(REFUSE._messages.checkVLA), 'core prompts the invalid VLA message');
	assert.equal(REFUSE._active, false, 'the Deva stays offline');
	if (REFUSE.modules?.client) await REFUSE.modules.client.close(); // close it if the Deva wrongly reached onReady
});

test('log refuses to start without its agent VLA', async () => {
	const {default: MISSING} = await import('./index.js?missing');
	const prompts = [];
	MISSING.listen('devacore:prompt', packet => prompts.push(packet.text));
	const result = await MISSING.init(client(null));
	assert.equal(result, MISSING._messages.personalVLA, 'init answers with the bad personal VLA message');
	assert.ok(prompts.includes(MISSING._messages.personalVLA), 'core prompts the bad personal VLA message');
	assert.equal(MISSING._active, false, 'the Deva stays offline');
	if (MISSING.modules?.client) await MISSING.modules.client.close(); // close it if the Deva wrongly reached onReady
});

"use strict";
// Copyright ©2000-2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:46926724281701890541 LICENSE.md

export default {
	async log(packet) {
		const log = await this.methods.sign('log', 'default', packet);
		return log;
	}
};

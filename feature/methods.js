"use strict";
// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:65258246426544441749 LICENSE.md

export default {
	async log(packet) {
		const log = await this.methods.sign('log', 'default', packet);
		return log;
	}
};

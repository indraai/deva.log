// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under the Vedic License Agreement LICENSE.md

export default {
	async log(packet) {
		const log = await this.methods.sign('log', 'default', packet);
		return log;
	}
};

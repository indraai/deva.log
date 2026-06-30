"use strict";
// Log Deva Test File
// Copyright ©2000-2025 Quinn A Michaels; All rights reserved. 
// Owner Signature Required For Lawful Use.
// Distributed under VLA:21872271854088286253 LICENSE.md
// Thursday, June 25, 2026 - 8:35:49 PM PST

import {expect} from 'chai';
import LogDeva from './index.js';

describe(LogDeva.me.name, () => {
  beforeEach(() => {
    return LogDeva.init()
  });
  it('Check the DEVA Object', () => {
    expect(LogDeva).to.be.an('object');
    expect(LogDeva).to.have.property('agent');
    expect(LogDeva).to.have.property('vars');
    expect(LogDeva).to.have.property('listeners');
    expect(LogDeva).to.have.property('methods');
    expect(LogDeva).to.have.property('modules');
  });
})

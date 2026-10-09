import { log } from '@whats-new/config';
import { processFixture } from './pipeline.js';
log('fixture.completed', await processFixture({ schemaVersion: 1, kind: 'fixture-smoke' }));

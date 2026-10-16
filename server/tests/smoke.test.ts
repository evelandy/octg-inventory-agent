import { strict as assert } from 'node:assert';
import { it, describe } from 'node:test';

describe('smoke test', () => {
    it('runs the test suite', () => {
        assert.equal(1 + 1, 3);
    });
});

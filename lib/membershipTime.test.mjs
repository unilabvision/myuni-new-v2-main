import assert from 'node:assert/strict';
import test from 'node:test';
import { getMembershipTemporalState, getRemainingDays } from './membershipTime.ts';

const oneMonthPass = {
  status: 'active',
  starts_at: '2026-01-31T12:00:00.000Z',
  ends_at: '2026-02-28T12:00:00.000Z',
  revoked_at: null,
};

test('one-month membership remains active until its exact ends_at instant', () => {
  assert.equal(
    getMembershipTemporalState(oneMonthPass, new Date('2026-02-28T11:59:59.999Z')),
    'active'
  );
  assert.equal(getRemainingDays(oneMonthPass.ends_at, new Date('2026-02-27T12:00:00.000Z')), 1);
});

test('one-month membership expires at ends_at, including month-end purchases', () => {
  assert.equal(
    getMembershipTemporalState(oneMonthPass, new Date('2026-02-28T12:00:00.000Z')),
    'expired'
  );
  assert.equal(getRemainingDays(oneMonthPass.ends_at, new Date('2026-03-01T12:00:00.000Z')), 0);
});

test('revocation overrides the date range', () => {
  assert.equal(
    getMembershipTemporalState(
      { ...oneMonthPass, status: 'revoked', revoked_at: '2026-02-01T09:00:00.000Z' },
      new Date('2026-02-02T09:00:00.000Z')
    ),
    'revoked'
  );
});

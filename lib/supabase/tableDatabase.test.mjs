import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseForRpc, databaseForTable } from './tableDatabase.ts';

test('checkout catalog tables are routed to their owning databases', () => {
  assert.equal(databaseForTable('myuni_courses'), 'learning');
  assert.equal(databaseForTable('myuni_course_tiers'), 'learning');
  assert.equal(databaseForTable('myuni_packages'), 'learning');
  assert.equal(databaseForTable('myuni_products'), 'identity');
});

test('payment and access tables stay in the identity database', () => {
  assert.equal(databaseForTable('orders'), 'identity');
  assert.equal(databaseForTable('discount_codes'), 'identity');
  assert.equal(databaseForTable('myuni_enrollments'), 'identity');
  assert.equal(databaseForRpc('myuni_membership_deliver_pass'), 'identity');
});

test('course application tables are routed to the forms database', () => {
  assert.equal(databaseForTable('myuni_site_application_forms'), 'forms');
  assert.equal(databaseForTable('myuni_site_applications'), 'forms');
});

test('learning RPCs are routed with course content', () => {
  assert.equal(databaseForRpc('get_course_rating_summary'), 'learning');
});

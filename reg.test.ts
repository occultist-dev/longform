import test from 'node:test';
import assert from 'node:assert/strict';
import { attributeReStr, directiveReStr, elementReStr, idReStr, textReStr } from "./reg.ts";


test('It parses directive declarations', () => {
  const re = new RegExp(directiveReStr, 'gm')
  const res = re.exec('@set::');

  assert(res?.groups?.w === '');
  assert(res?.groups?.d === 'set');
  assert(res?.groups?.a == null);
});

test('It parses directives with inline args', () => {
  const re = new RegExp(directiveReStr, 'gm')
  const res = re.exec('  @allow-elements:: div, p, strong  ');

  assert(res?.groups?.w === '  ');
  assert(res?.groups?.d === 'allow-elements');
  assert(res?.groups?.a === 'div, p, strong  ');
});

test('It parses ids', () => {
  const re = new RegExp(idReStr, 'gm');
  const res = re.exec('#foo-bar  ');

  assert(res?.groups?.w === '');
  assert(res?.groups?.i === 'foo-bar');
  assert(res?.groups.bare == null);
});

test('It parses bare ids', () => {
  const re = new RegExp(idReStr, 'gm');
  const res = re.exec('  ##fee_FI_foe-fum  ')

  assert(res?.groups?.w === '  ');
  assert(res?.groups?.i === 'fee_FI_foe-fum');
  assert(res?.groups?.b != null);
});

test('It parses elements', () => {
  const re = new RegExp(elementReStr, 'gm');
  const res = re.exec('    div:: ');

  assert(res?.groups?.w === '    ');
  assert(res?.groups?.e === 'div');
  assert(res?.groups?.t === '');
});

test('It parses elements with complex definitions', () => {
  const re = new RegExp(elementReStr, 'gm');
  const res = re.exec('foo-bar#fee.foe[fie=fum]:: Something <strong>strong</strong>');

  assert(res?.groups?.w === '');
  assert(res?.groups?.e === 'foo-bar');
  assert(res?.groups?.a === '#fee.foe[fie=fum]');
  assert(res?.groups?.t === 'Something <strong>strong</strong>');
});

test('It parses name only attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec('[checked]');

  assert(res?.groups?.a === 'checked');
  assert(res?.groups?.v == null);
});

test('It parses name value attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec('[name=Foo bar]');

  assert(res?.groups?.a === 'name');
  assert(res?.groups?.v == 'Foo bar');
});

test('It parses single quote name value attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec(`[name='Foo bar']`);

  assert(res?.groups?.a === 'name');
  assert(res?.groups?.v == 'Foo bar');
});

test('It parses double quote name value attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec('[name="Foo bar"]');

  assert(res?.groups?.a === 'name');
  assert(res?.groups?.v == 'Foo bar');
});

test('It parses text content', () => {
  const re = new RegExp(textReStr);
  const res = re.exec('  <div>Test</div>');

  assert(res?.groups?.w === '  ');
  assert(res?.groups?.t === '<div>Test</div>')
});

test('It ignores text content without identaion', () => {
  const re = new RegExp(textReStr);
  const res = re.exec('<div>Test</div>');

  assert(res == null)
});
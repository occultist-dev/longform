import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedAttributesReStr, allowedElementsReStr, attributeReStr, directiveReStr, elementReStr, forOfReStr, idReStr, textReStr } from "./reg.ts";


test('It parses directive declarations', () => {
  const re = new RegExp(directiveReStr, 'gm')
  const res = re.exec('@set::');

  assert(res?.groups?.d === 'set');
  assert(res?.groups?.ia == null);
});

test('It parses directives with inline args', () => {
  const re = new RegExp(directiveReStr, 'gm')
  const res = re.exec('  @allow-elements:: div, p, strong  ');

  assert(res?.groups?.d === 'allow-elements');
  assert(res?.groups?.ia === 'div, p, strong  ');
});

test('It parses ids', () => {
  const re = new RegExp(idReStr, 'gm');
  const res = re.exec('#foo-bar  ');

  assert(res?.groups?.i === 'foo-bar');
  assert(res?.groups?.b == null);
});

test('It parses bare ids', () => {
  const re = new RegExp(idReStr, 'gm');
  const res = re.exec('  ##fee_FI_foe-fum  ')

  assert(res?.groups?.i === 'fee_FI_foe-fum');
  assert(res?.groups?.b != null);
});

test('It parses elements', () => {
  const re = new RegExp(elementReStr, 'gm');
  const res = re.exec('    div:: ');

  assert(res?.groups?.e === 'div');
  assert(res?.groups?.it == null);
});

test('It parses elements with complex definitions', () => {
  const re = new RegExp(elementReStr, 'gm');
  const res = re.exec('foo-bar#fee.foe[fie=fum]:: Something <strong>strong</strong>');

  assert(res?.groups?.e === 'foo-bar');
  assert(res?.groups?.ea === '#fee.foe[fie=fum]');
  assert(res?.groups?.it === 'Something <strong>strong</strong>');
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
  assert(res?.groups?.v3 == 'Foo bar');
});

test('It parses single quote name value attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec(`[name='Foo bar']`);

  assert(res?.groups?.a === 'name');
  assert(res?.groups?.v1 == 'Foo bar');
});

test('It parses double quote name value attributes', () => {
  const re = new RegExp(attributeReStr, 'gm');
  const res = re.exec('[name="Foo bar"]');

  assert(res?.groups?.a === 'name');
  assert(res?.groups?.v2 == 'Foo bar');
});

test('It parses for of loops', { only: true }, () => {
  const re = new RegExp(forOfReStr, 'gm');
  const res = re.exec('  for abc__123 of foo-bar:: ');

  assert(res?.groups?.dv === 'abc__123');
  assert(res?.groups?.l == 'foo-bar');
});

test('It parses text content', () => {
  const re = new RegExp(textReStr);
  const res = re.exec('  <div>Test</div>');

  assert(res?.groups?.t === '<div>Test</div>')
});

test('It parses allowed elements', () => {
  const re = new RegExp(allowedElementsReStr, 'gm');
  let index = 0;
  let match: RegExpExecArray | null;

  const lf = `a[href target]`;
  while ((match = re.exec(lf))) {
    if (index === 0) {
      assert(match?.groups?.e === 'a');
      assert(match?.groups?.a === 'href target')
    }

    index++;
  }
});

test('It parses allowed attributes', () => {
  const re = new RegExp(allowedAttributesReStr, 'gm');
  let index = 0;
  let match: RegExpExecArray | null;

  const lf = `aria-* href target`;
  while ((match = re.exec(lf))) {
    if (index === 0) {
      assert(match?.groups?.a === 'aria-');
    } else if (index === 1) {
      assert(match?.groups?.a === 'href');
    } else {
      assert(match?.groups?.a === 'target');
    }

    index++;
  }
});
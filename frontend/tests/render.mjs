import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let passed = 0;
function test(name, work) { work(); passed++; console.log(`PASS ${name}`); }
try {
  const { default: HtmlOrText } = await vite.ssrLoadModule('/src/components/security/HtmlOrText.jsx');
  const { readPreviewFragment } = await vite.ssrLoadModule('/src/hooks/useAnnouncementPreview.js');
  const notice = '<div data-lab="notice">Fictional injected notice</div>';
  for (const feature of ['Reflected XSS', 'Stored XSS', 'DOM XSS']) {
    for (const mode of ['vulnerable', 'safe']) {
      test(`${feature}: actual shared renderer in ${mode} mode`, () => {
        const html = renderToStaticMarkup(React.createElement(HtmlOrText, { mode, value: notice }));
        assert.ok(html.includes(mode === 'safe' ? '&lt;div' : '<div data-lab="notice">'));
        if (mode === 'safe') assert.ok(!html.includes('<div data-lab="notice">'));
      });
    }
  }
  test('DOM fragment decodes visible payload', () => assert.equal(readPreviewFragment('#preview=' + encodeURIComponent(notice)), notice));
  test('DOM fragment does not read other parameters', () => assert.equal(readPreviewFragment('#other=notice'), ''));
  test('DOM fragment malformed encoding remains text', () => assert.equal(readPreviewFragment('#preview=%E0%A4'), '%E0%A4'));
  const { default: DataTable } = await vite.ssrLoadModule('/src/components/ui/DataTable.jsx');
  test('records table escapes injected values', () => {
    const html = renderToStaticMarkup(React.createElement(DataTable, { columns: [{ key:'value', label:'Result' }], rows:[{ value:notice }] }));
    assert.ok(html.includes('&lt;div'));
    assert.ok(!html.includes('<div data-lab="notice">'));
  });
  const { default: Guide } = await vite.ssrLoadModule('/src/pages/SecurityGuide.jsx');
  test('guide shows payloads as text without executing markup', () => {
    const html = renderToStaticMarkup(React.createElement(Guide));
    assert.ok(html.includes('&lt;div'));
    assert.ok(html.includes('information_schema.tables'));
  });
  console.log(`${passed} rendering/fragment checks passed. These are not browser interaction tests.`);
} finally { await vite.close(); }

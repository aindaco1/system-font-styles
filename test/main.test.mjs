import assert from 'node:assert/strict';
import test from 'node:test';

import systemFontStyles from '../dist/main.js';

const MAX_ACTIONS_PER_BLOCK = 64;

function collectActionBlocks(blocks) {
  const found = [];
  for (const block of blocks) {
    if (block.type === 'actions') {
      found.push(block);
    }
    if (Array.isArray(block.blocks)) {
      found.push(...collectActionBlocks(block.blocks));
    }
  }
  return found;
}

function createContext() {
  return {
    document: {
      type: 'doc',
      content: [{ type: 'action', content: [{ type: 'text', text: 'Test' }] }],
    },
    documentMode: 'screenplay',
    currentElementType: 'action',
    previousElementType: null,
    isCurrentEmpty: false,
    selectionFrom: 1,
    selectionTo: 1,
    formValues: {},
    metadata: { documentId: 'system-font-action-limit-test' },
  };
}

test('chunks large family and variant lists into host-valid action blocks', async () => {
  let panel = null;
  let hostCallCount = 0;
  const families = Array.from({ length: 130 }, (_, familyIndex) => ({
    name: `Font ${String(familyIndex).padStart(3, '0')}`,
    variants: Array.from(
      { length: familyIndex === 0 ? 130 : 1 },
      (_, variantIndex) => ({
        name: `Variant ${String(variantIndex).padStart(3, '0')}`,
        weight: 100 + variantIndex,
        style: 'normal',
      })
    ),
  }));

  systemFontStyles.setup({
    registerUIControl() {},
    registerUIPanel(definition) {
      panel = definition;
    },
    async requestPermission(permission) {
      assert.equal(permission, 'system:fonts');
      return true;
    },
    async hostCall(operation) {
      assert.equal(operation, 'system:list_fonts');
      hostCallCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { families };
    },
    async replaceDocument() {},
  });

  assert.ok(panel, 'plugin should register its panel');
  const [initialContent] = await Promise.all([
    panel.onRender(createContext()),
    panel.onRender(createContext()),
  ]);
  assert.equal(hostCallCount, 1, 'concurrent panel renders should share one font-list request');
  const familyScroll = initialContent.blocks.find((block) => block.type === 'scroll');
  assert.ok(familyScroll, 'panel should render a scrollable family list');
  const familyActionBlocks = collectActionBlocks(familyScroll.blocks);
  assert.deepEqual(familyActionBlocks.map((block) => block.actions.length), [64, 64, 2]);

  const selectedContent = (await panel.onAction({
    ...createContext(),
    actionId: 'family-0',
  })).content;
  const allActionBlocks = collectActionBlocks(selectedContent.blocks);
  assert.ok(allActionBlocks.every((block) => block.actions.length <= MAX_ACTIONS_PER_BLOCK));
  const variantActionCount = allActionBlocks
    .flatMap((block) => block.actions)
    .filter((action) => action.id.startsWith('variant-')).length;
  assert.equal(variantActionCount, 130);
});

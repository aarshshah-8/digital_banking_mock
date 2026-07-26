import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Surfaced in the a11y panel and asserted in CI by the test runner.
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#FFFFFF' },
        { name: 'surfaceMuted', value: '#F4F6F8' },
        { name: 'brandPrimary', value: '#012169' },
      ],
    },
  },
};

export default preview;

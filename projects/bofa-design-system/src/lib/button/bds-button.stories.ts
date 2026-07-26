import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';

import { BofaDesignSystemModule } from '../bofa-design-system.module';
import { BdsButtonComponent } from './bds-button.component';

const meta: Meta<BdsButtonComponent> = {
  title: 'BDS/Button',
  component: BdsButtonComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BofaDesignSystemModule] })],
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'danger'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  render: (args) => ({
    props: args,
    template: `<bds-button [variant]="variant" [disabled]="disabled" [loading]="loading">Transfer Funds</bds-button>`,
  }),
};
export default meta;

type Story = StoryObj<BdsButtonComponent>;

export const Primary: Story = {
  args: { variant: 'primary', disabled: false, loading: false },
};

export const Secondary: Story = {
  args: { variant: 'secondary', disabled: false, loading: false },
};

export const Danger: Story = {
  args: { variant: 'danger', disabled: false, loading: false },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, loading: false },
};

export const Loading: Story = {
  args: { variant: 'primary', disabled: false, loading: true },
};

/** Every variant and state on one canvas — the frame used for before/after diffs. */
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:16px; align-items:flex-start">
        <div style="display:flex; gap:12px; align-items:center">
          <bds-button variant="primary">Primary</bds-button>
          <bds-button variant="secondary">Secondary</bds-button>
          <bds-button variant="danger">Danger</bds-button>
        </div>
        <div style="display:flex; gap:12px; align-items:center">
          <bds-button variant="primary" [disabled]="true">Disabled</bds-button>
          <bds-button variant="secondary" [disabled]="true">Disabled</bds-button>
          <bds-button variant="danger" [disabled]="true">Disabled</bds-button>
        </div>
        <div style="display:flex; gap:12px; align-items:center">
          <bds-button variant="primary" [loading]="true">Loading</bds-button>
        </div>
      </div>
    `,
  }),
};

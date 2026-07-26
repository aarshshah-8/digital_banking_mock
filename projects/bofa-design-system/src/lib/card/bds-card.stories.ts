import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';

import { BofaDesignSystemModule } from '../bofa-design-system.module';
import { BdsCardComponent } from './bds-card.component';

const meta: Meta<BdsCardComponent> = {
  title: 'BDS/Card',
  component: BdsCardComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BofaDesignSystemModule] })],
  argTypes: {
    title: { control: 'text' },
    elevated: { control: 'boolean' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:360px">
        <bds-card [title]="title" [elevated]="elevated">
          <div>$12,480.55 <small>as of 3:42 PM</small></div>
          <div>$3,102.10 <small>as of 3:42 PM</small></div>
        </bds-card>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<BdsCardComponent>;

export const Elevated: Story = {
  args: { title: 'Account Balance', elevated: true },
};

export const Flat: Story = {
  args: { title: 'Account Balance', elevated: false },
};

/**
 * No title input, so no `mat-card-header` renders. MDC changes `mat-card`'s
 * internal padding, so a headerless card is the case most likely to shift.
 */
export const NoTitle: Story = {
  args: { title: '', elevated: true },
};

export const WithActions: Story = {
  render: () => ({
    template: `
      <div style="max-width:360px">
        <bds-card title="Quick Actions">
          <div style="display:flex; gap:12px; padding-top:8px">
            <bds-button variant="primary">Transfer Funds</bds-button>
            <bds-button variant="secondary">View Statements</bds-button>
          </div>
        </bds-card>
      </div>
    `,
  }),
};

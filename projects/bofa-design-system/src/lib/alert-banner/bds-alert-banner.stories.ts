import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';

import { BofaDesignSystemModule } from '../bofa-design-system.module';
import { BdsAlertBannerComponent } from './bds-alert-banner.component';

const meta: Meta<BdsAlertBannerComponent> = {
  title: 'BDS/Alert Banner',
  component: BdsAlertBannerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BofaDesignSystemModule] })],
  argTypes: {
    severity: { control: 'radio', options: ['info', 'success', 'warning', 'danger'] },
    dismissible: { control: 'boolean' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:560px">
        <bds-alert-banner [severity]="severity" [dismissible]="dismissible">
          Session established for a1b2c3. MFA verification pending.
        </bds-alert-banner>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<BdsAlertBannerComponent>;

export const Info: Story = { args: { severity: 'info', dismissible: true } };
export const Success: Story = { args: { severity: 'success', dismissible: true } };
export const Warning: Story = { args: { severity: 'warning', dismissible: true } };
export const Danger: Story = { args: { severity: 'danger', dismissible: true } };

/** Every severity on one canvas — the frame used for before/after diffs. */
export const AllSeverities: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; max-width:560px">
        <bds-alert-banner severity="info">Session established. MFA verification pending.</bds-alert-banner>
        <bds-alert-banner severity="success">Transfer of $250.00 completed.</bds-alert-banner>
        <bds-alert-banner severity="warning">Your session expires in 2 minutes.</bds-alert-banner>
        <bds-alert-banner severity="danger">We could not verify this payee. Contact support.</bds-alert-banner>
      </div>
    `,
  }),
};

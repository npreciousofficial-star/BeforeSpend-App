/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bucket, BucketTemplate } from '../types';

export const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: 'salary',
    name: "Owner's salary",
    percentage: 35,
    color: 'emerald', // We can use semantic color tags
    destinationAccount: 'OPay',
    note: 'Personal salary and living allowance',
    balance: 0,
  },
  {
    id: 'growth',
    name: 'Growth fund',
    percentage: 20,
    color: 'blue',
    destinationAccount: 'Fidelity savings',
    note: 'Skills, hardware upgrades, and business development',
    balance: 0,
  },
  {
    id: 'opex',
    name: 'Operating expenses',
    percentage: 15,
    color: 'amber',
    destinationAccount: 'Fidelity current',
    note: 'Subscriptions, internet, power, co-working space',
    balance: 0,
  },
  {
    id: 'tax',
    name: 'Tax reserve',
    percentage: 10,
    color: 'red',
    destinationAccount: 'Kuda locked',
    note: 'Federal and local taxes pool',
    balance: 0,
  },
  {
    id: 'emergency',
    name: 'Emergency fund',
    percentage: 10,
    color: 'purple',
    destinationAccount: 'Kuda locked',
    note: 'Personal and business emergency backup',
    balance: 0,
  },
  {
    id: 'profit',
    name: 'Profit / Quarterly bonus',
    percentage: 10,
    color: 'teal',
    destinationAccount: 'Fidelity',
    note: 'Quarterly dividend payments',
    balance: 0,
  },
];

export const BUCKET_TEMPLATES: BucketTemplate[] = [
  {
    name: 'Freelance Designer (Default)',
    description: 'Perfect for solo creators balancing business reinvestment, personal income, and tax obligations.',
    buckets: [
      { name: "Owner's salary", percentage: 35, color: 'emerald', destinationAccount: 'OPay', note: 'Personal living allowance' },
      { name: 'Growth fund', percentage: 20, color: 'blue', destinationAccount: 'Fidelity savings', note: 'Reinvestment & upgrades' },
      { name: 'Operating expenses', percentage: 15, color: 'amber', destinationAccount: 'Fidelity current', note: 'Tools, internet & subscriptions' },
      { name: 'Tax reserve', percentage: 10, color: 'red', destinationAccount: 'Kuda locked', note: 'Saved for tax times' },
      { name: 'Emergency fund', percentage: 10, color: 'purple', destinationAccount: 'Kuda locked', note: 'Safety net vault' },
      { name: 'Profit / Quarterly bonus', percentage: 10, color: 'teal', destinationAccount: 'Fidelity', note: 'Quarterly business profit distribution' },
    ],
  },
  {
    name: 'Simple Balanced (50/30/20)',
    description: 'Classic personal finance setup for straightforward budgeting.',
    buckets: [
      { name: 'Needs & Essentials', percentage: 50, color: 'blue', destinationAccount: 'Fidelity current', note: 'Rent, utility bills, food' },
      { name: 'Wants & Lifestyle', percentage: 30, color: 'amber', destinationAccount: 'OPay', note: 'Leisure, dining out, entertainment' },
      { name: 'Savings & Investments', percentage: 20, color: 'emerald', destinationAccount: 'Kuda locked', note: 'Wealth building & reserves' },
    ],
  },
  {
    name: 'Agency Blueprint',
    description: 'For freelancers scaling up and hiring contractors or running digital ads.',
    buckets: [
      { name: 'Contractor Fees', percentage: 40, color: 'indigo', destinationAccount: 'Fidelity current', note: 'Subcontractors & collaborators' },
      { name: 'Agency Operating Cost', percentage: 20, color: 'amber', destinationAccount: 'Fidelity savings', note: 'Software subscriptions & ads' },
      { name: 'Founder Draw', percentage: 25, color: 'emerald', destinationAccount: 'OPay', note: 'Your salary draw' },
      { name: 'Tax Pool', percentage: 10, color: 'red', destinationAccount: 'Kuda locked', note: 'Company tax reserve' },
      { name: 'Client Entertainment', percentage: 5, color: 'pink', destinationAccount: 'Fidelity', note: 'Gifts & hosting clients' },
    ],
  },
  {
    name: 'Aggressive Saver',
    description: 'Designed for high-earning periods where you want to secure future financial independence quickly.',
    buckets: [
      { name: 'Bare Minimum Living', percentage: 30, color: 'blue', destinationAccount: 'OPay', note: 'Frugal lifestyle pool' },
      { name: 'Aggressive Investment', percentage: 40, color: 'emerald', destinationAccount: 'Kuda locked', note: 'Stocks, mutual funds, real estate' },
      { name: 'Emergency & Opportunity Runway', percentage: 20, color: 'purple', destinationAccount: 'Fidelity savings', note: 'Runway build up' },
      { name: 'Taxes', percentage: 10, color: 'red', destinationAccount: 'Kuda locked', note: 'Mandatory tax savings' },
    ],
  },
];

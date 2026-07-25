/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bucket, BucketTemplate } from '../types';

export const DEFAULT_BUCKETS_NG: Bucket[] = [
  {
    id: 'salary',
    name: "Owner's salary",
    percentage: 35,
    color: 'emerald',
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

export const DEFAULT_BUCKETS_US: Bucket[] = [
  {
    id: 'salary',
    name: "Primary Essentials",
    percentage: 50,
    color: 'emerald',
    destinationAccount: 'Chase Checking',
    note: 'Essential living expenses (housing, utilities, groceries)',
    balance: 0,
  },
  {
    id: 'growth',
    name: 'Wants & Lifestyle',
    percentage: 25,
    color: 'blue',
    destinationAccount: 'Capital One Checking',
    note: 'Dining out, entertainment, and personal shopping',
    balance: 0,
  },
  {
    id: 'emergency',
    name: 'Emergency Savings',
    percentage: 15,
    color: 'purple',
    destinationAccount: 'Wells Fargo Savings',
    note: 'High-yield savings for emergency buffer',
    balance: 0,
  },
  {
    id: 'growth-investment',
    name: 'Wealth Brokerage',
    percentage: 10,
    color: 'teal',
    destinationAccount: 'Fidelity Investments',
    note: 'Retirement contributions, ETFs, index funds',
    balance: 0,
  },
];

export const BUCKET_TEMPLATES_NG: BucketTemplate[] = [
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
];

export const BUCKET_TEMPLATES_US: BucketTemplate[] = [
  {
    name: 'US Balanced (50/30/20)',
    description: 'Standard US personal finance blueprint for essentials, fun, and savings.',
    buckets: [
      { name: 'Needs & Essentials', percentage: 50, color: 'blue', destinationAccount: 'Chase Checking', note: 'Rent, mortgage, groceries' },
      { name: 'Wants & Fun', percentage: 30, color: 'amber', destinationAccount: 'Capital One Checking', note: 'Shopping, vacations, leisure' },
      { name: 'Emergency & Savings', percentage: 20, color: 'emerald', destinationAccount: 'Wells Fargo Savings', note: 'HYS yield reserves' },
    ],
  },
  {
    name: 'US Freelancer (1099 Creator)',
    description: 'Designed for US independent contractors managing W-2 draw, 1040-ES tax pool, and business costs.',
    buckets: [
      { name: 'Founder Draw (Net)', percentage: 45, color: 'emerald', destinationAccount: 'Chase Checking', note: 'Personal monthly draw' },
      { name: 'Tax Holdback (1040-ES)', percentage: 25, color: 'red', destinationAccount: 'Marcus Savings', note: 'Estimated tax holdback' },
      { name: 'Business Expenses', percentage: 15, color: 'amber', destinationAccount: 'Capital One Business', note: 'Tools, ads, and software' },
      { name: 'Retirement Growth (SEP-IRA)', percentage: 15, color: 'indigo', destinationAccount: 'Fidelity Investment', note: 'Tax-deferred savings' },
    ],
  },
];

export const getLocalizedDefaultBuckets = (currency: string): Bucket[] => {
  return currency === 'USD' ? DEFAULT_BUCKETS_US : DEFAULT_BUCKETS_NG;
};

export const getLocalizedTemplates = (currency: string): BucketTemplate[] => {
  return currency === 'USD' ? BUCKET_TEMPLATES_US : BUCKET_TEMPLATES_NG;
};

export function detectUserRegionAndCurrency(): { currency: string; region: 'US' | 'NG' } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && (
      tz.startsWith('America') || 
      tz.includes('US') || 
      tz.includes('New_York') || 
      tz.includes('Chicago') || 
      tz.includes('Los_Angeles') || 
      tz.includes('Phoenix') || 
      tz.includes('Denver') ||
      tz.includes('Anchorage') ||
      tz.includes('Honolulu')
    )) {
      return { currency: 'USD', region: 'US' };
    }
  } catch (e) {
    // Ignore timezone resolution failures
  }
  return { currency: 'NGN', region: 'NG' };
}

import React, { useState } from 'react';
import { Building2, CheckCircle2, ShieldCheck, CreditCard, ArrowRight, User, Phone, Mail, MapPin, Award, Clock, FileText, Upload, Wallet, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { AppNotification, Bucket } from '../types';
import { CustomSelect } from './CustomSelect';

interface CacRegistrationModuleProps {
  userEmail?: string;
  userName?: string;
  defaultCurrency?: string;
  buckets?: Bucket[];
  onAddNotification?: (notification: Omit<AppNotification, 'id' | 'time'>) => void;
  onDeductFromBucket?: (bucketId: string, amount: number, note: string) => boolean;
}

export interface CacOrderData {
  id: string;
  packageType: 'business_name' | 'company_ltd' | 'ngo_trustee';
  proposedName1: string;
  proposedName2: string;
  businessNature: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  proprietorName: string;
  proprietorDob: string;
  proprietorGender: string;
  proprietorIdType: string;
  proprietorIdNumber: string;
  proprietorAddress: string;
  paymentMethod: 'bucket_deduction' | 'bank_transfer' | 'card_online';
  paidBucketName?: string;
  status: 'PAYMENT_RECEIVED' | 'NAME_RESERVED' | 'FILING_CAC' | 'CERTIFICATE_ISSUED';
  createdAt: string;
  amountPaid: number;
}

export const CacRegistrationModule: React.FC<CacRegistrationModuleProps> = ({
  userEmail = '',
  userName = '',
  defaultCurrency = 'NGN',
  buckets = [],
  onAddNotification,
  onDeductFromBucket
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [packageType, setPackageType] = useState<'business_name' | 'company_ltd' | 'ngo_trustee'>('business_name');
  
  // Step 2 Form fields
  const [proposedName1, setProposedName1] = useState('');
  const [proposedName2, setProposedName2] = useState('');
  const [businessNature, setBusinessNature] = useState('General Contracts & Digital Services');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState(userEmail);
  const [businessPhone, setBusinessPhone] = useState('');

  // Step 3 Proprietor Details
  const [proprietorName, setProprietorName] = useState(userName);
  const [proprietorDob, setProprietorDob] = useState('');
  const [proprietorGender, setProprietorGender] = useState('Male');
  const [proprietorIdType, setProprietorIdType] = useState('NIN (National Identification Number)');
  const [proprietorIdNumber, setProprietorIdNumber] = useState('');
  const [proprietorAddress, setProprietorAddress] = useState('');
  const [passportFileName, setPassportFileName] = useState('');
  const [idDocFileName, setIdDocFileName] = useState('');

  // Step 4 Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'bucket_deduction' | 'bank_transfer' | 'card_online'>('bucket_deduction');
  const [selectedBucketId, setSelectedBucketId] = useState<string>(buckets[0]?.id || '');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Application Storage
  const [orders, setOrders] = useState<CacOrderData[]>(() => {
    try {
      const saved = localStorage.getItem('beforespend_cac_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeOrder, setActiveOrder] = useState<CacOrderData | null>(null);

  const packagePrices = {
    business_name: 25000,
    company_ltd: 65000,
    ngo_trustee: 110000
  };

  const currentPrice = packagePrices[packageType];

  const handleExecutePaymentAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setIsProcessingPayment(true);

    let bucketName = '';

    if (paymentMethod === 'bucket_deduction') {
      const chosenBucket = buckets.find(b => b.id === selectedBucketId);
      if (!chosenBucket) {
        setPaymentError('Please select a valid budget bucket for payment.');
        setIsProcessingPayment(false);
        return;
      }
      bucketName = chosenBucket.name;

      if (chosenBucket.balance < currentPrice) {
        setPaymentError(`Insufficient balance in ${chosenBucket.name} (${formatCurrency(chosenBucket.balance, defaultCurrency)} available). Please select another bucket or pay via Transfer.`);
        setIsProcessingPayment(false);
        return;
      }

      if (onDeductFromBucket) {
        const success = onDeductFromBucket(chosenBucket.id, currentPrice, `CAC Registration Fee for ${proposedName1}`);
        if (!success) {
          setPaymentError('Failed to process bucket payment deduction.');
          setIsProcessingPayment(false);
          return;
        }
      }
    }

    setTimeout(() => {
      const newOrder: CacOrderData = {
        id: `CAC-${Math.floor(100000 + Math.random() * 900000)}`,
        packageType,
        proposedName1,
        proposedName2,
        businessNature,
        businessAddress,
        businessEmail,
        businessPhone,
        proprietorName,
        proprietorDob,
        proprietorGender,
        proprietorIdType,
        proprietorIdNumber,
        proprietorAddress,
        paymentMethod,
        paidBucketName: bucketName || 'Direct Online Transfer',
        status: 'PAYMENT_RECEIVED',
        createdAt: new Date().toISOString(),
        amountPaid: currentPrice
      };

      const updated = [newOrder, ...orders];
      setOrders(updated);
      localStorage.setItem('beforespend_cac_orders', JSON.stringify(updated));

      setActiveOrder(newOrder);
      setIsProcessingPayment(false);
      setStep(5);

      if (onAddNotification) {
        onAddNotification({
          title: 'CAC Registration Payment Confirmed',
          message: `Payment of ${formatCurrency(currentPrice, defaultCurrency)} for "${proposedName1}" received. Application submitted for CAC filing.`,
          type: 'reminder',
          read: false
        });
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      
      {/* Module Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0E2A47] via-[#061626] to-[#00A896] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 border border-white/20 text-xs font-black uppercase tracking-widest">
              <Building2 className="w-3.5 h-3.5 text-teal-300" />
              <span>Official Enterprise Filing Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CAC Business Registration & TIN Service</h1>
            <p className="text-sm text-teal-100 max-w-xl font-medium">
              Register your Enterprise Name, Private Limited Company (LTD), or NGO directly with the Corporate Affairs Commission (CAC) and receive your FIRS Tax Identification Number (TIN).
            </p>
          </div>

          {/* Existing Orders Quick Switcher */}
          {orders.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shrink-0 space-y-2">
              <div className="text-xs font-extrabold flex items-center justify-between gap-4">
                <span>Active Registrations ({orders.length})</span>
                <span className="text-teal-300">Live Status</span>
              </div>
              <button
                onClick={() => {
                  setActiveOrder(orders[0]);
                  setStep(5);
                }}
                className="w-full py-2 px-4 rounded-xl bg-white text-[#0E2A47] font-black text-xs hover:bg-teal-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-[#00A896]" />
                <span>Track Order Status ({orders[0].id})</span>
              </button>
            </div>
          )}
        </div>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-8 pt-6 border-t border-white/15">
          {[
            { num: 1, title: '1. Select Package' },
            { num: 2, title: '2. Business Info' },
            { num: 3, title: '3. Proprietor & ID' },
            { num: 4, title: '4. Checkout Invoice' },
            { num: 5, title: '5. Order Tracker' }
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step || (s.num === 5 && activeOrder)) setStep(s.num as any);
              }}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                step === s.num
                  ? 'bg-white text-[#0E2A47] font-black shadow-md'
                  : step > s.num
                  ? 'bg-white/10 text-teal-200 font-bold hover:bg-white/20'
                  : 'bg-white/5 text-white/50 font-medium'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  step === s.num
                    ? 'bg-[#0E2A47] text-white'
                    : step > s.num
                    ? 'bg-teal-400 text-slate-950'
                    : 'bg-white/20 text-white'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-xs truncate">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Module Content */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-10 shadow-xs">

        {/* STEP 1: PACKAGE SELECTION */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-[#0E2A47] dark:text-white">Choose Your Business Entity Structure</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Select your preferred legal entity. Every package includes official CAC Name Availability Reservation, Certificate Generation, Status Report, and FREE FIRS Corporate Tax Identification Number (TIN).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  id: 'business_name',
                  title: 'Business Name (Enterprise)',
                  tag: 'BEST FOR FREELANCERS & MONO-PROPRIETORS',
                  price: 25000,
                  features: [
                    'CAC Certificate of Registration',
                    'Official Status Report / BN Document',
                    'FREE FIRS Tax Identification Number (TIN)',
                    'Official CAC Name Availability Reservation',
                    'Turnaround: 3-5 Working Days'
                  ]
                },
                {
                  id: 'company_ltd',
                  title: 'Private Limited Company (LTD)',
                  tag: 'FOR GROWING COMPANIES & PARTNERSHIPS',
                  price: 65000,
                  features: [
                    'CAC Certificate of Incorporation',
                    'MEMART (Memorandum & Articles)',
                    'Official Status Report & Share Capital',
                    'FREE Corporate FIRS Tax ID (TIN)',
                    'Turnaround: 5-7 Working Days'
                  ]
                },
                {
                  id: 'ngo_trustee',
                  title: 'Incorporated Trustee (NGO)',
                  tag: 'FOR NON-PROFITS & ASSOCIATIONS',
                  price: 110000,
                  features: [
                    'Trustees Certificate of Incorporation',
                    'Approved Constitution Document',
                    'Official National Newspaper Publication',
                    'Status Report Document',
                    'Turnaround: 10-14 Working Days'
                  ]
                }
              ].map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setPackageType(pkg.id as any)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    packageType === pkg.id
                      ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/20 shadow-lg scale-[1.01]'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  {packageType === pkg.id && (
                    <div className="absolute -top-3.5 right-6 bg-[#00A896] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-xs">
                      Selected
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black text-[#00A896] uppercase tracking-wider">{pkg.tag}</span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{pkg.title}</h3>
                    <div className="text-3xl font-black text-[#0E2A47] dark:text-teal-400 mt-3">
                      {formatCurrency(pkg.price, defaultCurrency)}
                    </div>
                    <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#00A896] shrink-0 mt-0.5" />
                          <span className="font-semibold">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPackageType(pkg.id as any);
                        setStep(2);
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        packageType === pkg.id
                          ? 'bg-[#00A896] hover:bg-[#028072] text-white shadow-md'
                          : 'bg-[#0E2A47] hover:bg-[#00A896] text-white'
                      }`}
                    >
                      <span>Proceed with {pkg.title.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS INFORMATION */}
        {step === 2 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-3">
              <Award className="w-5 h-5 text-[#00A896] shrink-0" />
              <span>Provide 2 proposed name options in order of preference for CAC Name Availability Search.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Proposed Business Name Option 1 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Digital Ventures"
                  value={proposedName1}
                  onChange={(e) => setProposedName1(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Proposed Business Name Option 2 (Alternative) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Solutions"
                  value={proposedName2}
                  onChange={(e) => setProposedName2(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                Nature of Business / Core Category *
              </label>
              <select
                value={businessNature}
                onChange={(e) => setBusinessNature(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
              >
                <option value="General Contracts & Digital Services">General Contracts & Digital Services</option>
                <option value="Information Technology & Software Development">Information Technology & Software Development</option>
                <option value="E-Commerce & Retail Trading">E-Commerce & Retail Trading</option>
                <option value="Financial Technology & Consulting">Financial Technology & Consulting</option>
                <option value="Creative Arts, Design & Media Production">Creative Arts, Design & Media Production</option>
                <option value="Agriculture & Food Processing">Agriculture & Food Processing</option>
                <option value="Real Estate & Logistics">Real Estate & Logistics</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Business Physical Operating Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14 Marina Road, Victoria Island, Lagos"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Official Business Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="official@company.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                Business Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+234 801 234 5678"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
              />
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-6 rounded-2xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!proposedName1 || !businessAddress || !businessEmail}
                onClick={() => setStep(3)}
                className="py-3.5 px-8 rounded-2xl bg-[#0E2A47] hover:bg-[#00A896] disabled:opacity-50 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Proprietor Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PROPRIETOR & ID DOCUMENT UPLOADS */}
        {step === 3 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00A896] shrink-0" />
              <span>CAC requires identity verification for the principal proprietor / director.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Proprietor / Director Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as shown on NIN"
                  value={proprietorName}
                  onChange={(e) => setProprietorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={proprietorDob}
                  onChange={(e) => setProprietorDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  Identity Document Type *
                </label>
                <select
                  value={proprietorIdType}
                  onChange={(e) => setProprietorIdType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                >
                  <option value="NIN (National Identification Number)">NIN (National Identification Number)</option>
                  <option value="International Passport">International Passport</option>
                  <option value="Drivers License">Drivers License</option>
                  <option value="Voters Card">Voters Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                  ID Number / NIN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12345678901"
                  value={proprietorIdNumber}
                  onChange={(e) => setProprietorIdNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-2">
                Proprietor Personal Residential Address *
              </label>
              <input
                type="text"
                required
                placeholder="Residential address"
                value={proprietorAddress}
                onChange={(e) => setProprietorAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#00A896] outline-none"
              />
            </div>

            {/* Document File Uploads with 2MB limit validation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  Passport Photograph Upload (Max 2MB Limit)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert(`File exceeds 2MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image smaller than 2MB.`);
                        e.target.value = '';
                      } else {
                        setPassportFileName(file.name);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0E2A47] file:text-white hover:file:bg-[#00A896] cursor-pointer"
                />
                {passportFileName && <p className="text-xs font-bold text-emerald-600">✓ Uploaded: {passportFileName}</p>}
              </div>

              <div className="p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  ID Copy / NIN Slip Upload (Max 2MB Limit)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert(`File exceeds 2MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image smaller than 2MB.`);
                        e.target.value = '';
                      } else {
                        setIdDocFileName(file.name);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0E2A47] file:text-white hover:file:bg-[#00A896] cursor-pointer"
                />
                {idDocFileName && <p className="text-xs font-bold text-emerald-600">✓ Uploaded: {idDocFileName}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-2xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!proprietorName || !proprietorIdNumber}
                onClick={() => setStep(4)}
                className="py-3.5 px-8 rounded-2xl bg-[#0E2A47] hover:bg-[#00A896] disabled:opacity-50 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CHECKOUT INVOICE & PAYMENT PROMPT */}
        {step === 4 && (
          <form onSubmit={handleExecutePaymentAndSubmit} className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0E2A47] dark:text-white">Order Invoice & Payment Confirmation</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Review your filing details and select your payment method to authorize CAC submission.
              </p>
            </div>

            {/* Order Invoice Summary */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00A896]">Filing Entity</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{proposedName1}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Filing Fee</span>
                  <div className="text-2xl font-black text-[#00A896]">{formatCurrency(currentPrice, defaultCurrency)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-zinc-400">
                <div><span className="text-slate-400">Package Type:</span> <strong className="text-slate-900 dark:text-white uppercase">{packageType.replace('_', ' ')}</strong></div>
                <div><span className="text-slate-400">Applicant:</span> <strong className="text-slate-900 dark:text-white">{proprietorName}</strong></div>
                <div><span className="text-slate-400">FIRS TIN ID:</span> <strong className="text-emerald-600 font-bold">FREE INCLUDED</strong></div>
                <div><span className="text-slate-400">Official Email:</span> <strong className="text-slate-900 dark:text-white">{businessEmail}</strong></div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Select Payment Method</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Deduct from BeforeSpend Bucket */}
                <div
                  onClick={() => setPaymentMethod('bucket_deduction')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    paymentMethod === 'bucket_deduction'
                      ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/20 shadow-md'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#00A896]" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">Deduct from Budget Bucket</span>
                    </div>
                    {paymentMethod === 'bucket_deduction' && <Check className="w-4 h-4 text-[#00A896]" />}
                  </div>

                  {paymentMethod === 'bucket_deduction' && buckets.length > 0 && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                        Select Bucket:
                      </label>
                      <select
                        value={selectedBucketId}
                        onChange={(e) => setSelectedBucketId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-bold"
                      >
                        {buckets.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({formatCurrency(b.balance, defaultCurrency)} available)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Option 2: Direct Card / Bank Transfer */}
                <div
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/20 shadow-md'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#00A896]" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">Card Payment / Bank Transfer</span>
                    </div>
                    {paymentMethod === 'bank_transfer' && <Check className="w-4 h-4 text-[#00A896]" />}
                  </div>
                  <p className="text-[11px] text-slate-500">Pay securely via instant online card processing or bank transfer.</p>
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-6 rounded-2xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="py-4 px-10 rounded-2xl bg-[#00A896] hover:bg-[#028072] text-white text-sm font-black shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessingPayment ? 'Processing Order...' : `Pay & Submit Order (${formatCurrency(currentPrice, defaultCurrency)})`}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: LIVE ORDER TRACKER */}
        {step === 5 && activeOrder && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0E2A47] via-[#061626] to-[#00A896] text-white text-center space-y-3 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-teal-300" />
              </div>
              <h2 className="text-2xl font-black">{activeOrder.proposedName1}</h2>
              <p className="text-xs text-teal-100">Order Reference Number: <strong className="font-mono">{activeOrder.id}</strong></p>
              <div className="inline-block px-4 py-1.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-extrabold uppercase tracking-widest">
                Payment Confirmed ({formatCurrency(activeOrder.amountPaid, defaultCurrency)})
              </div>
            </div>

            {/* Live Progress Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Live CAC Order Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: '1. Payment Received', desc: 'Fee verified & filing queued', done: true },
                  { title: '2. Name Availability', desc: 'Searching CAC database', done: true },
                  { title: '3. Legal Documentation', desc: 'Filing Status Report & MEMART', done: false },
                  { title: '4. Certificate & TIN', desc: 'Official CAC Certificate issued', done: false }
                ].map((t, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border transition-all ${t.done ? 'bg-teal-50/50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900/30' : 'bg-slate-50 border-gray-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-2 ${t.done ? 'bg-[#00A896] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {t.done ? '✓' : idx + 1}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Summary Box */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-2">Order Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-zinc-400">
                <div><span>Entity Structure:</span> <strong className="text-slate-900 dark:text-white uppercase">{activeOrder.packageType.replace('_', ' ')}</strong></div>
                <div><span>Payment Method:</span> <strong className="text-slate-900 dark:text-white">{activeOrder.paidBucketName}</strong></div>
                <div><span>Official Business Email:</span> <strong className="text-slate-900 dark:text-white">{activeOrder.businessEmail}</strong></div>
                <div><span>Estimated Completion:</span> <strong className="text-[#00A896] font-bold">3-5 Working Days</strong></div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-6 rounded-2xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-extrabold cursor-pointer"
              >
                Register Another Entity
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-6 rounded-2xl bg-[#0E2A47] text-white text-xs font-black hover:bg-[#00A896] transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Print Application Invoice</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CacRegistrationModule;

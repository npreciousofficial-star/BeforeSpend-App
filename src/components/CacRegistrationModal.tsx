import React, { useState } from 'react';
import { Building2, CheckCircle2, ShieldCheck, CreditCard, FileText, ArrowRight, X, User, Phone, Mail, MapPin, Award, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { AppNotification } from '../types';

interface CacRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  defaultCurrency?: string;
  onAddNotification?: (notification: Omit<AppNotification, 'id' | 'time'>) => void;
}

export interface CacApplicationData {
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
  status: 'SUBMITTED' | 'NAME_RESERVED' | 'PROCESSING_CAC' | 'APPROVED';
  createdAt: string;
  amountPaid: number;
}

export const CacRegistrationModal: React.FC<CacRegistrationModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = '',
  defaultCurrency = 'NGN',
  onAddNotification
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [packageType, setPackageType] = useState<'business_name' | 'company_ltd' | 'ngo_trustee'>('business_name');
  
  // Form fields
  const [proposedName1, setProposedName1] = useState('');
  const [proposedName2, setProposedName2] = useState('');
  const [businessNature, setBusinessNature] = useState('General Contracts & Digital Services');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState(userEmail);
  const [businessPhone, setBusinessPhone] = useState('');

  // Director / Proprietor Details
  const [proprietorName, setProprietorName] = useState(userName);
  const [proprietorDob, setProprietorDob] = useState('');
  const [proprietorGender, setProprietorGender] = useState<'Male' | 'Female'>('Male');
  const [proprietorIdType, setProprietorIdType] = useState('NIN (National Identification Number)');
  const [proprietorIdNumber, setProprietorIdNumber] = useState('');
  const [proprietorAddress, setProprietorAddress] = useState('');

  // Submitted Application state
  const [submittedApps, setSubmittedApps] = useState<CacApplicationData[]>(() => {
    try {
      const saved = localStorage.getItem('beforespend_cac_applications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeApp, setActiveApp] = useState<CacApplicationData | null>(null);

  if (!isOpen) return null;

  const packagePrices = {
    business_name: 25000,
    company_ltd: 65000,
    ngo_trustee: 110000
  };

  const currentPrice = packagePrices[packageType];

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();

    const newApp: CacApplicationData = {
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
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      amountPaid: currentPrice
    };

    const updated = [newApp, ...submittedApps];
    setSubmittedApps(updated);
    localStorage.setItem('beforespend_cac_applications', JSON.stringify(updated));

    setActiveApp(newApp);
    setStep(4);

    if (onAddNotification) {
      onAddNotification({
        title: 'CAC Registration Submitted',
        message: `Your application for "${proposedName1}" has been queued for Name Reservation processing.`,
        type: 'reminder',
        read: false
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0E2A47] to-[#00A896] p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">CAC Business Registration Tool</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-200 border border-teal-300/30">Official Partner</span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">Register your business & get a FREE Tax Identification Number (TIN)</p>
            </div>
          </div>

          {/* Step Progress Pills */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/15">
            {[
              { num: 1, title: 'Select Package' },
              { num: 2, title: 'Business Details' },
              { num: 3, title: 'Proprietor Info' },
              { num: 4, title: 'Status Tracker' }
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < step || (s.num === 4 && activeApp)) setStep(s.num as any);
                }}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  step === s.num
                    ? 'text-white font-bold'
                    : step > s.num
                    ? 'text-teal-200 font-semibold'
                    : 'text-white/40 font-medium'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    step === s.num
                      ? 'bg-white text-[#0E2A47]'
                      : step > s.num
                      ? 'bg-teal-400 text-slate-900'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="text-xs hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: PACKAGE SELECTION */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center max-w-lg mx-auto">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Choose Your Business Structure</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  We handle the full Corporate Affairs Commission (CAC) filing, name reservation, certificate generation, and TIN assignment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'business_name',
                    title: 'Business Name',
                    tag: 'Most Popular for Freelancers',
                    price: 25000,
                    features: [
                      'CAC Certificate of Registration',
                      'Status Report / BN Document',
                      'FREE FIRS Tax ID (TIN)',
                      'Official CAC Name Reservation',
                      'Turnaround: 3-5 Working Days'
                    ]
                  },
                  {
                    id: 'company_ltd',
                    title: 'Private Limited (LTD)',
                    tag: 'For Growing Companies',
                    price: 65000,
                    features: [
                      'CAC Certificate of Incorporation',
                      'MEMART & Status Report',
                      'FREE Corporate TIN',
                      'Share Capital Certificate',
                      'Turnaround: 5-7 Working Days'
                    ]
                  },
                  {
                    id: 'ngo_trustee',
                    title: 'Incorporated Trustee',
                    tag: 'For NGOs & Associations',
                    price: 110000,
                    features: [
                      'Trustee Incorporation Certificate',
                      'Approved Constitution Document',
                      'Official Newspaper Publication',
                      'Status Report',
                      'Turnaround: 10-14 Working Days'
                    ]
                  }
                ].map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setPackageType(pkg.id as any)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                      packageType === pkg.id
                        ? 'border-[#00A896] bg-teal-50/40 dark:bg-teal-950/20 shadow-md scale-[1.02]'
                        : 'border-gray-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {packageType === pkg.id && (
                      <div className="absolute -top-3 right-4 bg-[#00A896] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                        Selected
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-extrabold text-[#00A896] uppercase tracking-wider">{pkg.tag}</span>
                      <h5 className="text-base font-black text-slate-900 dark:text-white mt-0.5">{pkg.title}</h5>
                      <div className="text-2xl font-black text-[#0E2A47] dark:text-teal-400 mt-2">
                        {formatCurrency(pkg.price, defaultCurrency)}
                      </div>
                      <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Existing Applications Toggle */}
              {submittedApps.length > 0 && (
                <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#00A896]" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">You have {submittedApps.length} active registration application(s)</p>
                      <p className="text-[11px] text-slate-500">Track progress and status reports</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveApp(submittedApps[0]);
                      setStep(4);
                    }}
                    className="py-2 px-4 rounded-xl bg-[#0E2A47] text-white text-xs font-bold hover:bg-[#00A896] transition-all cursor-pointer"
                  >
                    View Status Tracker
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3 px-6 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Business Info</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS INFORMATION */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00A896] shrink-0" />
                <span>Provide 2 proposed name options in order of preference for CAC Name Availability Search.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Proposed Business Name Option 1 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={proposedName1}
                    onChange={(e) => setProposedName1(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Proposed Business Name Option 2 (Alternative) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Digital Services"
                    value={proposedName2}
                    onChange={(e) => setProposedName2(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Nature of Business / Category *
                </label>
                <select
                  value={businessNature}
                  onChange={(e) => setBusinessNature(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Business Operating Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14 Marina Road, Victoria Island, Lagos"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Official Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="official@company.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Business Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+234 801 234 5678"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!proposedName1 || !businessAddress || !businessEmail}
                  onClick={() => setStep(3)}
                  className="py-3 px-6 rounded-xl bg-[#0E2A47] hover:bg-[#00A896] disabled:opacity-50 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Proprietor Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROPRIETOR / DIRECTOR DETAILS */}
          {step === 3 && (
            <form onSubmit={handleSubmitApplication} className="space-y-5">
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00A896] shrink-0" />
                <span>CAC requires valid identity verification for the principal proprietor / director.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Proprietor / Director Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name as shown on NIN"
                    value={proprietorName}
                    onChange={(e) => setProprietorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={proprietorDob}
                    onChange={(e) => setProprietorDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Identity Document Type *
                  </label>
                  <select
                    value={proprietorIdType}
                    onChange={(e) => setProprietorIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  >
                    <option value="NIN (National Identification Number)">NIN (National Identification Number)</option>
                    <option value="International Passport">International Passport</option>
                    <option value="Drivers License">Drivers License</option>
                    <option value="Voters Card">Voters Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    ID Number / NIN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345678901"
                    value={proprietorIdNumber}
                    onChange={(e) => setProprietorIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Proprietor Residential Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Proprietor personal residential address"
                  value={proprietorAddress}
                  onChange={(e) => setProprietorAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00A896] outline-none"
                />
              </div>

              {/* CAC Document File Uploads (Passport Photo & ID Card) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Passport Photo Upload (Max 2MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert(`File "${file.name}" exceeds the 2MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 2MB.`);
                          e.target.value = '';
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Clear white background passport photo</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    ID Document Copy / NIN Slip (Max 2MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert(`File "${file.name}" exceeds the 2MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 2MB.`);
                          e.target.value = '';
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Scanned copy of NIN slip or Passport page</span>
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <span>Selected Package:</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">{packageType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <span>CAC Filing & Name Search:</span>
                  <span className="font-bold text-emerald-600">INCLUDED</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <span>FIRS Corporate TIN:</span>
                  <span className="font-bold text-emerald-600">FREE ₦0.00</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-gray-200 dark:border-zinc-800">
                  <span>Total Amount Payable:</span>
                  <span className="text-[#00A896]">{formatCurrency(currentPrice, defaultCurrency)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="py-3 px-8 rounded-xl bg-[#00A896] hover:bg-[#028072] text-white text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit CAC Registration ({formatCurrency(currentPrice, defaultCurrency)})</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: APPLICATION STATUS TRACKER */}
          {step === 4 && activeApp && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0E2A47] to-[#00A896] text-white text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black">{activeApp.proposedName1}</h4>
                <p className="text-xs text-teal-100">Application Reference ID: <strong>{activeApp.id}</strong></p>
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-teal-200 border border-white/20 mt-2">
                  Status: Name Reservation Submitted
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4 px-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Live CAC Processing Timeline</h5>
                <div className="space-y-3">
                  {[
                    { title: '1. Form Submitted & Processing Fee Paid', desc: 'Application data captured & queued for verification', done: true },
                    { title: '2. CAC Name Reservation Search', desc: 'Filing proposed names with Corporate Affairs Commission', done: true },
                    { title: '3. CAC Stamp Duty & Legal Review', desc: 'Preparing Status Report and Memorandum Documents', done: false },
                    { title: '4. Official CAC Certificate & TIN Issued', desc: 'Certificate of Incorporation & FIRS Tax ID dispatched to email', done: false }
                  ].map((t, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${t.done ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
                        {t.done ? '✓' : idx + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${t.done ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}>{t.title}</p>
                        <p className="text-[11px] text-slate-500">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                <div className="flex justify-between"><span>Proposed Name:</span><strong className="text-slate-900 dark:text-white">{activeApp.proposedName1}</strong></div>
                <div className="flex justify-between"><span>Structure:</span><strong className="uppercase text-slate-900 dark:text-white">{activeApp.packageType.replace('_', ' ')}</strong></div>
                <div className="flex justify-between"><span>Applicant Email:</span><strong className="text-slate-900 dark:text-white">{activeApp.businessEmail}</strong></div>
                <div className="flex justify-between"><span>Estimated Delivery:</span><strong className="text-[#00A896]">3-5 Working Days</strong></div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Register Another Business
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-[#0E2A47] text-white text-xs font-black hover:bg-[#00A896] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CacRegistrationModal;

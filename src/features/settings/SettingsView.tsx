/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BucketSetupTable } from './BucketSetupTable';
import { Avatar } from '../../components/Avatar';
import { CustomSelect } from '../../components/CustomSelect';
import { compressImageFile } from '../../utils';
import { getLocalizedTemplates } from '../../data/defaultBuckets';
import { Bucket, BucketTemplate } from '../../types';
import { User, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { SkeletonFormCard, SkeletonContentBlock } from '../../components/Preloader';

interface SettingsViewProps {
  onEditBucket: (bucket: Bucket) => void;
  onDeleteBucket: (id: string) => void;
  onApplyTemplate: (template: BucketTemplate) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onEditBucket,
  onDeleteBucket,
  onApplyTemplate,
}) => {
  const { userProfile, setUserProfile, profile, setProfile, dataLoaded, addToast } = useAppContext();

  const [editProfileName, setEditProfileName] = useState(userProfile.name);
  const [editProfileEmail, setEditProfileEmail] = useState(userProfile.email || '');
  const [editProfileRole, setEditProfileRole] = useState(userProfile.role);
  const [editProfileCurrency, setEditProfileCurrency] = useState(userProfile.defaultCurrency);
  const [editProfileAvatar, setEditProfileAvatar] = useState(userProfile.avatar || 'avatar_1');

  useEffect(() => {
    setEditProfileName(userProfile.name);
    setEditProfileEmail(userProfile.email || '');
    setEditProfileRole(userProfile.role);
    setEditProfileCurrency(userProfile.defaultCurrency);
    setEditProfileAvatar(userProfile.avatar || 'avatar_1');
  }, [userProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...userProfile,
      name: editProfileName.trim() || 'Valued Budgeter',
      email: editProfileEmail.trim(),
      role: editProfileRole,
      defaultCurrency: editProfileCurrency,
      avatar: editProfileAvatar,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updated);
    setProfile(updated);
    addToast('Profile updated successfully!', 'success');
  };

  return (
    <div id="view-settings-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {!dataLoaded ? (
        <>
          <div className="lg:col-span-4">
            <SkeletonFormCard />
          </div>
          <div className="lg:col-span-8">
            <SkeletonContentBlock />
          </div>
        </>
      ) : (
        <>
          {/* Profile Config Form */}
          <div className="lg:col-span-4 space-y-5">
            <form
              id="profile-settings-form"
              onSubmit={handleSaveProfile}
              className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-[#00A896]" />
                <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-base">
                  Account Profile Details
                </h3>
              </div>

              <div className="space-y-4">
                {/* Interactive Avatar Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-3.5 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
                    <Avatar
                      avatar={editProfileAvatar}
                      name={editProfileName}
                      className="w-12 h-12 text-base flex-shrink-0"
                    />
                    <div className="space-y-1 flex-1">
                      <input
                        type="file"
                        id="avatar-upload-input"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              addToast('Image size should be less than 2MB', 'error');
                              return;
                            }
                            try {
                              const compressed = await compressImageFile(file, 256, 0.82);
                              setEditProfileAvatar(compressed);
                              addToast('Avatar uploaded! Click Save Changes below.', 'success');
                            } catch {
                              addToast('Failed to process image. Try a different file.', 'error');
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="avatar-upload-input"
                        className="px-3 py-1.5 border border-gray-200 dark:border-zinc-800 hover:border-[#00A896]/50 dark:hover:border-[#00A896]/50 bg-white hover:bg-gray-50/50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-gray-750 dark:text-zinc-200 text-[10px] font-bold rounded-lg shadow-2xs cursor-pointer transition-all inline-flex items-center gap-1 select-none"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#00A896]" /> Upload Avatar Image
                      </label>
                      <p className="text-[9px] text-gray-400 leading-tight">
                        Supports PNG, JPEG or WebP (max 2MB).
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editProfileEmail}
                    onChange={(e) => setEditProfileEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                    Profile Role
                  </label>
                  <select
                    value={editProfileRole}
                    onChange={(e) => setEditProfileRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Freelancer & Contractor">Freelancer & Contractor</option>
                    <option value="Salaried Employee / Professional">
                      Salaried Employee / Professional
                    </option>
                    <option value="Business Owner / Entrepreneur">
                      Business Owner / Entrepreneur
                    </option>
                    <option value="Student & Personal Budgeter">Student & Personal Budgeter</option>
                  </select>
                </div>

                <div>
                  <CustomSelect
                    label="Default Base Currency"
                    value={editProfileCurrency}
                    onChange={(val) => setEditProfileCurrency(val)}
                    options={[
                      { value: 'NGN', label: 'NGN (₦) - Nigerian Naira' },
                      { value: 'USD', label: 'USD ($) - US Dollar' },
                      { value: 'EUR', label: 'EUR (€) - Euro' },
                      { value: 'GBP', label: 'GBP (£) - British Pound' },
                      { value: 'CAD', label: 'CAD (C$) - Canadian Dollar' },
                    ]}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00A896] hover:bg-[#0E2A47] text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>Save Profile Changes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Bucket Allocation Manager & Templates */}
          <div className="lg:col-span-8 space-y-6">
            <BucketSetupTable onEditBucket={onEditBucket} onDeleteBucket={onDeleteBucket} />

            {/* Localized Blueprint Templates */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-4 shadow-sm">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm">
                  Budget Blueprints & Frameworks
                </h3>
                <p className="text-[10px] text-gray-400">
                  Apply a pre-configured allocation framework to restructure your budget categories.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getLocalizedTemplates(userProfile.defaultCurrency).map((template) => (
                  <div
                    key={template.name}
                    className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-zinc-200">
                        {template.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        {template.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {template.buckets.map((b) => (
                          <span
                            key={b.name}
                            className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400"
                          >
                            {b.name} ({b.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyTemplate(template)}
                      className="w-full py-1.5 px-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-[#00A896] hover:bg-[#00A896] hover:text-white dark:text-teal-400 dark:hover:bg-teal-950 text-[10px] font-black cursor-pointer transition-all border border-[#00A896]/10 text-center"
                    >
                      Apply Blueprint
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

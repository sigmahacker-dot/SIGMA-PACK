'use client';

import React from 'react';
import {
  api, ErrorNote, Field, PageHeader, Spinner, SuccessNote,
} from '@/components/admin/ui';

type Settings = {
  site_name: string;
  whatsapp_number: string;
  jazzcash_number: string;
  easypaisa_number: string;
  support_text: string;
};

const EMPTY_SETTINGS: Settings = {
  site_name: '',
  whatsapp_number: '',
  jazzcash_number: '',
  easypaisa_number: '',
  support_text: '',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<Settings>(EMPTY_SETTINGS);
  const [account, setAccount] = React.useState({ username: '', email: '' });
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [flash, setFlash] = React.useState('');
  const [savingSite, setSavingSite] = React.useState(false);
  const [savingAccount, setSavingAccount] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [s, me] = await Promise.all([
          api('/api/admin/settings'),
          api('/api/auth/me'),
        ]);
        setSettings({ ...EMPTY_SETTINGS, ...(s || {}) });
        if (me && me.user) {
          setAccount({
            username: me.user.username || '',
            email: me.user.email || '',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSite(true);
    setError('');
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setFlash('Site settings saved.');
    } catch (err: any) {
      setError(err.message || 'Save failed.');
    } finally {
      setSavingSite(false);
    }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentPassword) {
      setError('Your current password is required to change account details.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSavingAccount(true);
    try {
      await api('/api/admin/account', {
        method: 'PUT',
        body: JSON.stringify({
          username: account.username,
          email: account.email,
          current_password: currentPassword,
          ...(newPassword ? { new_password: newPassword } : {}),
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setFlash('Account updated.');
    } catch (err: any) {
      setError(err.message || 'Account update failed.');
    } finally {
      setSavingAccount(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Settings" sub="Site, payments, and your admin account" />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveSettings} className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-bold text-white">Site & Payments</h2>
          <div className="space-y-4">
            <Field label="Site name">
              <input
                className="input-dark"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                className="input-dark"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="e.g. 923001234567"
              />
            </Field>
            <Field label="JazzCash number">
              <input
                className="input-dark"
                value={settings.jazzcash_number}
                onChange={(e) => setSettings({ ...settings, jazzcash_number: e.target.value })}
              />
            </Field>
            <Field label="Easypaisa number">
              <input
                className="input-dark"
                value={settings.easypaisa_number}
                onChange={(e) => setSettings({ ...settings, easypaisa_number: e.target.value })}
              />
            </Field>
            <Field label="Support text">
              <textarea
                className="input-dark min-h-20"
                value={settings.support_text}
                onChange={(e) => setSettings({ ...settings, support_text: e.target.value })}
                placeholder="Shown on support / help pages"
              />
            </Field>
            <button type="submit" disabled={savingSite} className="btn-primary disabled:opacity-60">
              {savingSite ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>

        <form onSubmit={saveAccount} className="glass h-fit rounded-2xl p-6">
          <h2 className="mb-4 font-bold text-white">My Account</h2>
          <div className="space-y-4">
            <Field label="Username">
              <input
                className="input-dark"
                value={account.username}
                onChange={(e) => setAccount({ ...account, username: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input-dark"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
              />
            </Field>
            <Field label="Current password (required)">
              <input
                type="password"
                className="input-dark"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password (leave empty to keep)">
              <input
                type="password"
                className="input-dark"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button type="submit" disabled={savingAccount} className="btn-primary disabled:opacity-60">
              {savingAccount ? 'Saving…' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

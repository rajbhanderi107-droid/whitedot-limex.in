import { useState } from 'react';
import type { FormEvent } from 'react';
import { submitPublic } from '../../cinematic/publicApi';
import type { SubmitStatus } from '../../cinematic/publicApi';
import './InquiryFormV2.css';

export function InquiryFormV2() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', companyName: '', message: '', _hp: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: string) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    if (form._hp) { setStatus('sent'); return; }
    try {
      const { _hp, ...payload } = form;
      await submitPublic('inquiry', { ...payload, sourcePage: 'consultation-v2' });
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', companyName: '', message: '', _hp: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="v2iq-success">
        <span className="v2iq-success-dot" aria-hidden="true" />
        <div>
          <p className="v2iq-success-title">Inquiry received</p>
          <p className="v2iq-success-body">
            Our team will contact you within two business days about your LIMEX material requirements.
          </p>
          <button type="button" className="v2iq-reset" onClick={() => setStatus('idle')}>
            Send another inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="v2iq-form" onSubmit={handleSubmit} noValidate>
      <div className="v2iq-row">
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-name">Name</label>
          <input
            id="v2iq-name"
            className="v2iq-input"
            name="name"
            placeholder="Your full name"
            required
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
          />
        </div>
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-email">Email</label>
          <input
            id="v2iq-email"
            className="v2iq-input"
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="v2iq-row">
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-phone">Phone</label>
          <input
            id="v2iq-phone"
            className="v2iq-input"
            name="phone"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
          />
        </div>
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-company">Company</label>
          <input
            id="v2iq-company"
            className="v2iq-input"
            name="companyName"
            placeholder="Company name"
            value={form.companyName}
            onChange={set('companyName')}
            autoComplete="organization"
          />
        </div>
      </div>
      <div className="v2iq-field">
        <label className="v2iq-label" htmlFor="v2iq-message">Requirements</label>
        <textarea
          id="v2iq-message"
          className="v2iq-textarea"
          name="message"
          placeholder="Tell us about your product, current material, target volume, and what you're looking for..."
          rows={5}
          value={form.message}
          onChange={set('message')}
        />
      </div>
      {/* Honeypot — invisible to humans, bots fill it */}
      <input
        name="_hp"
        type="text"
        value={form._hp}
        onChange={set('_hp')}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
      />
      {status === 'error' && <p className="v2iq-error">{errorMsg}</p>}
      <button type="submit" className="v2iq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit Inquiry'}
      </button>
    </form>
  );
}

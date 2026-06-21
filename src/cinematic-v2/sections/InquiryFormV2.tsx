import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { submitPublic, withAttribution, warmPublicBackend } from '../../cinematic/publicApi';
import type { SubmitStatus } from '../../cinematic/publicApi';
import './InquiryFormV2.css';

export function InquiryFormV2() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    city: '',
    industry: '',
    inquiryType: '',
    message: '',
    _hp: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [slowWarn, setSlowWarn] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ping backend when form first mounts so cold start begins early
  useEffect(() => { warmPublicBackend(); }, []);

  const set = (key: string) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    setSlowWarn(false);
    // After 12s still sending → show "server waking up" hint
    slowTimer.current = setTimeout(() => setSlowWarn(true), 12_000);
    if (form._hp) { setStatus('sent'); return; }
    try {
      const { _hp, ...payload } = form;
      await submitPublic('inquiry', { ...payload, sourcePage: withAttribution('consultation-v2') });
      setStatus('sent');
      setForm({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        city: '',
        industry: '',
        inquiryType: '',
        message: '',
        _hp: '',
      });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      if (slowTimer.current) { clearTimeout(slowTimer.current); slowTimer.current = null; }
      setSlowWarn(false);
    }
  };

  if (status === 'sent') {
    return (
      <div className="v2iq-success">
        <span className="v2iq-success-dot" aria-hidden="true" />
        <div>
          <p className="v2iq-success-title">Inquiry received</p>
          <p className="v2iq-success-body">
            Our team will contact you soon about your LIMEX material requirements.
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
            placeholder="Phone"
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
        <label className="v2iq-label" htmlFor="v2iq-industry">Industry</label>
        <select
          id="v2iq-industry"
          className="v2iq-input"
          name="industry"
          value={form.industry}
          onChange={set('industry')}
        >
          <option value="">Select industry</option>
          <option value="Packaging">Packaging</option>
          <option value="FMCG">FMCG</option>
          <option value="Automotive">Automotive</option>
          <option value="Building materials">Building materials</option>
          <option value="Export / trading">Export / trading</option>
          <option value="Other manufacturing">Other manufacturing</option>
        </select>
      </div>
      <div className="v2iq-row">
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-city">City</label>
          <input
            id="v2iq-city"
            className="v2iq-input"
            name="city"
            placeholder="Ahmedabad"
            value={form.city}
            onChange={set('city')}
            autoComplete="address-level2"
          />
        </div>
        <div className="v2iq-field">
          <label className="v2iq-label" htmlFor="v2iq-type">Buying intent</label>
          <select
            id="v2iq-type"
            className="v2iq-input"
            name="inquiryType"
            value={form.inquiryType}
            onChange={set('inquiryType')}
          >
            <option value="">Select intent</option>
            <option value="Technical consultation">Technical consultation</option>
            <option value="Price discovery">Price discovery</option>
            <option value="Sample / trial">Sample / trial</option>
            <option value="Bulk procurement">Bulk procurement</option>
            <option value="Partnership / distribution">Partnership / distribution</option>
          </select>
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
      {slowWarn && (
        <p className="v2iq-error" style={{ color: 'var(--v2-accent)' }}>
          Server is waking up — please keep this tab open, it takes ~60s on first request.
        </p>
      )}
      <button type="submit" className="v2iq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending… (server waking up, please wait)' : 'Submit Inquiry'}
      </button>
    </form>
  );
}

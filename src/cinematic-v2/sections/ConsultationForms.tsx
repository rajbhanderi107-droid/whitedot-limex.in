import { useState } from 'react';
import type { FormEvent } from 'react';
import { appendAttributionNote, getLeadAttribution, submitPublic } from '../../cinematic/publicApi';
import type { SubmitStatus } from '../../cinematic/publicApi';
import './InquiryFormV2.css';

/* V1 Quote / Sample / Calculator forms, ported into the v2 (.v2iq-*) styling.
   Field sets + copy are V1 verbatim; posts via the shared submitPublic helper. */

function Success({ title, body, reset, label }: { title: string; body: string; reset: () => void; label: string }) {
  return (
    <div className="v2iq-success">
      <span className="v2iq-success-dot" aria-hidden="true" />
      <div>
        <p className="v2iq-success-title">{title}</p>
        <p className="v2iq-success-body">{body}</p>
        <button type="button" className="v2iq-reset" onClick={reset}>{label}</button>
      </div>
    </div>
  );
}

const HP = (
  value: string,
  onChange: (e: { target: { value: string } }) => void,
) => (
  <input
    name="_hp" type="text" value={value} onChange={onChange} autoComplete="off"
    tabIndex={-1} aria-hidden="true"
    style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
  />
);

/* ── Quote ─────────────────────────────────────────────────────────────── */
const QUOTE_EMPTY = {
  contactPerson: '', email: '', phone: '', companyName: '',
  productCategory: '', currentMaterial: '', monthlyQuantity: '',
  targetApplication: '', message: '', _hp: '',
};

export function QuoteFormV2() {
  const [form, setForm] = useState(QUOTE_EMPTY);
  const [foodContactRequired, setFood] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const set = (k: keyof typeof QUOTE_EMPTY) => (e: { target: { value: string } }) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setStatus('sending'); setErrorMsg('');
    if (form._hp) { setStatus('sent'); return; }
    try {
      const { _hp, ...payload } = form;
      await submitPublic('quote-request', {
        ...payload,
        message: appendAttributionNote(payload.message, 'Campaign source'),
        foodContactRequired,
      });
      setStatus('sent'); setForm(QUOTE_EMPTY); setFood(false);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') return <Success title="Quote request received" body="Our team will prepare pricing for your specification and respond within one business day." reset={() => setStatus('idle')} label="Request another quote" />;

  return (
    <form className="v2iq-form" onSubmit={submit} noValidate>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Contact person *" required value={form.contactPerson} onChange={set('contactPerson')} aria-label="Contact person" />
        <input className="v2iq-input" type="email" placeholder="Email address *" required value={form.email} onChange={set('email')} aria-label="Email address" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Phone number" value={form.phone} onChange={set('phone')} aria-label="Phone number" />
        <input className="v2iq-input" placeholder="Company name" value={form.companyName} onChange={set('companyName')} aria-label="Company name" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Product category (e.g. rigid packaging)" value={form.productCategory} onChange={set('productCategory')} aria-label="Product category" />
        <input className="v2iq-input" placeholder="Current material / polymer grade" value={form.currentMaterial} onChange={set('currentMaterial')} aria-label="Current material or polymer grade" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Monthly quantity (e.g. 5 tonnes)" value={form.monthlyQuantity} onChange={set('monthlyQuantity')} aria-label="Monthly quantity" />
        <input className="v2iq-input" placeholder="Target application" value={form.targetApplication} onChange={set('targetApplication')} aria-label="Target application" />
      </div>
      <label className="v2iq-check">
        <input type="checkbox" checked={foodContactRequired} onChange={(e) => setFood(e.target.checked)} aria-label="Food contact grade required" />
        Food-contact grade required
      </label>
      <textarea className="v2iq-textarea" placeholder="Anything else we should know — strength, colour, sustainability targets, price range..." rows={4} value={form.message} onChange={set('message')} aria-label="Additional requirements" />
      {HP(form._hp, set('_hp'))}
      {status === 'error' && <p className="v2iq-error">{errorMsg}</p>}
      <button type="submit" className="v2iq-submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : 'Request Quote'}</button>
    </form>
  );
}

/* ── Sample ────────────────────────────────────────────────────────────── */
const SAMPLE_EMPTY = {
  contactPerson: '', email: '', phone: '', companyName: '',
  requestedMaterialType: '', application: '', quantity: '',
  deliveryAddress: '', remarks: '', _hp: '',
};

export function SampleFormV2() {
  const [form, setForm] = useState(SAMPLE_EMPTY);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const set = (k: keyof typeof SAMPLE_EMPTY) => (e: { target: { value: string } }) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setStatus('sending'); setErrorMsg('');
    if (form._hp) { setStatus('sent'); return; }
    try {
      const { _hp, ...payload } = form;
      await submitPublic('sample-request', {
        ...payload,
        remarks: appendAttributionNote(payload.remarks, 'Campaign source', 2000),
      });
      setStatus('sent'); setForm(SAMPLE_EMPTY);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') return <Success title="Sample request received" body="Trial samples ship within 14 working days. Our team will confirm logistics shortly." reset={() => setStatus('idle')} label="Request another sample" />;

  return (
    <form className="v2iq-form" onSubmit={submit} noValidate>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Contact person *" required value={form.contactPerson} onChange={set('contactPerson')} aria-label="Contact person" />
        <input className="v2iq-input" type="email" placeholder="Email address *" required value={form.email} onChange={set('email')} aria-label="Email address" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Phone number" value={form.phone} onChange={set('phone')} aria-label="Phone number" />
        <input className="v2iq-input" placeholder="Company name" value={form.companyName} onChange={set('companyName')} aria-label="Company name" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Material type (e.g. pellet, sheet)" value={form.requestedMaterialType} onChange={set('requestedMaterialType')} aria-label="Material type" />
        <input className="v2iq-input" placeholder="Application / end product" value={form.application} onChange={set('application')} aria-label="Application or end product" />
      </div>
      <input className="v2iq-input" placeholder="Quantity needed (e.g. 5 kg)" value={form.quantity} onChange={set('quantity')} aria-label="Quantity needed" />
      <textarea className="v2iq-textarea" placeholder="Delivery address" rows={2} value={form.deliveryAddress} onChange={set('deliveryAddress')} aria-label="Delivery address" />
      <textarea className="v2iq-textarea" placeholder="Remarks (optional)" rows={3} value={form.remarks} onChange={set('remarks')} aria-label="Remarks" />
      {HP(form._hp, set('_hp'))}
      {status === 'error' && <p className="v2iq-error">{errorMsg}</p>}
      <button type="submit" className="v2iq-submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : 'Request Sample'}</button>
    </form>
  );
}

/* ── Calculator ────────────────────────────────────────────────────────── */
const CO2_PLASTIC = 2.7;
const CO2_LIMEX = 1.0;
const CALC_EMPTY = {
  companyName: '', contactPerson: '', email: '', phone: '',
  plasticType: '', currentGrade: '', monthlyQuantityKg: '',
  replacementPct: '50', currentPricePerKg: '', limexPricePerKg: '', _hp: '',
};
interface Estimate { plasticReduction: number; co2Impact: number; costSaving: number | null; }
function compute(form: typeof CALC_EMPTY): Estimate | null {
  const qty = parseFloat(form.monthlyQuantityKg);
  const pct = parseFloat(form.replacementPct);
  if (!qty || qty <= 0 || !pct || pct <= 0) return null;
  const replacedAnnual = qty * 12 * (pct / 100);
  const co2Impact = replacedAnnual * (CO2_PLASTIC - CO2_LIMEX);
  const cur = parseFloat(form.currentPricePerKg);
  const lim = parseFloat(form.limexPricePerKg);
  const costSaving = cur > 0 && lim > 0 ? (cur - lim) * replacedAnnual : null;
  return { plasticReduction: replacedAnnual, co2Impact, costSaving };
}
const num = (n: number) => Math.round(n).toLocaleString('en-IN');

export function CalculatorFormV2() {
  const [form, setForm] = useState(CALC_EMPTY);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const set = (k: keyof typeof CALC_EMPTY) => (e: { target: { value: string } }) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));
  const estimate = compute(form);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setStatus('sending'); setErrorMsg('');
    if (form._hp) { setStatus('sent'); return; }
    try {
      await submitPublic('calculator-submission', {
        companyName: form.companyName, contactPerson: form.contactPerson,
        email: form.email, phone: form.phone, plasticType: form.plasticType,
        currentGrade: form.currentGrade,
        currentQuantity: form.monthlyQuantityKg ? `${form.monthlyQuantityKg} kg/month` : undefined,
        limexReplacementPercentage: parseFloat(form.replacementPct) || undefined,
        estimatedPlasticReduction: estimate?.plasticReduction,
        estimatedCo2Impact: estimate?.co2Impact,
        estimatedCostSaving: estimate?.costSaving ?? undefined,
        assumptionsUsed: {
          co2PlasticFactor: CO2_PLASTIC, co2LimexFactor: CO2_LIMEX,
          currentPricePerKg: parseFloat(form.currentPricePerKg) || null,
          limexPricePerKg: parseFloat(form.limexPricePerKg) || null,
          attribution: getLeadAttribution(),
          basis: 'annualised from monthly quantity × replacement %',
        },
      });
      setStatus('sent'); setForm(CALC_EMPTY);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') return <Success title="Estimate submitted" body="Our team will validate these figures against your line and follow up with a tailored assessment." reset={() => setStatus('idle')} label="Run another estimate" />;

  return (
    <form className="v2iq-form" onSubmit={submit} noValidate>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Plastic type (e.g. PP, PE)" value={form.plasticType} onChange={set('plasticType')} aria-label="Plastic type" />
        <input className="v2iq-input" placeholder="Current grade (optional)" value={form.currentGrade} onChange={set('currentGrade')} aria-label="Current grade" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" type="number" min="0" placeholder="Monthly quantity (kg) *" required value={form.monthlyQuantityKg} onChange={set('monthlyQuantityKg')} aria-label="Monthly quantity in kilograms" />
        <input className="v2iq-input" type="number" min="0" max="100" placeholder="LIMEX replacement %" value={form.replacementPct} onChange={set('replacementPct')} aria-label="LIMEX replacement percentage" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" type="number" min="0" placeholder="Current price ₹/kg (optional)" value={form.currentPricePerKg} onChange={set('currentPricePerKg')} aria-label="Current price per kilogram" />
        <input className="v2iq-input" type="number" min="0" placeholder="LIMEX price ₹/kg (optional)" value={form.limexPricePerKg} onChange={set('limexPricePerKg')} aria-label="LIMEX price per kilogram" />
      </div>

      {estimate && (
        <div className="v2iq-calc">
          <div className="v2iq-calc-stat">
            <span className="v2iq-calc-num">{num(estimate.plasticReduction)} kg/yr</span>
            <span className="v2iq-calc-label">Plastic replaced</span>
          </div>
          <div className="v2iq-calc-stat">
            <span className="v2iq-calc-num">{num(estimate.co2Impact)} kg/yr</span>
            <span className="v2iq-calc-label">CO₂e reduction (indicative)</span>
          </div>
          {estimate.costSaving !== null && (
            <div className="v2iq-calc-stat">
              <span className="v2iq-calc-num">₹{num(estimate.costSaving)}/yr</span>
              <span className="v2iq-calc-label">Material cost delta</span>
            </div>
          )}
        </div>
      )}
      <p className="v2iq-calc-note">Indicative only. Figures are directional and validated against your actual line during assessment.</p>

      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Contact person *" required value={form.contactPerson} onChange={set('contactPerson')} aria-label="Contact person" />
        <input className="v2iq-input" type="email" placeholder="Email address *" required value={form.email} onChange={set('email')} aria-label="Email address" />
      </div>
      <div className="v2iq-row">
        <input className="v2iq-input" placeholder="Phone number" value={form.phone} onChange={set('phone')} aria-label="Phone number" />
        <input className="v2iq-input" placeholder="Company name" value={form.companyName} onChange={set('companyName')} aria-label="Company name" />
      </div>
      {HP(form._hp, set('_hp'))}
      {status === 'error' && <p className="v2iq-error">{errorMsg}</p>}
      <button type="submit" className="v2iq-submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : 'Send My Estimate'}</button>
    </form>
  );
}

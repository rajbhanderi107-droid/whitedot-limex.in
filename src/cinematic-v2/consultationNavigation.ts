export const CONSULTATION_HASH = '#inquiry';
export const CONSULTATION_FORM_EVENT = 'whitedot:open-consultation-form';
export const GMAIL_CONTACT_HREF =
  'https://mail.google.com/mail/?view=cm&fs=1&to=office%40whitedotindia.in&su=WhiteDot%20LIMEX%20Inquiry';

export type ConsultationLeadForm = 'inquiry' | 'quote' | 'sample' | 'calculator';

export function openConsultationForm(formKey: ConsultationLeadForm = 'inquiry') {
  const formPanel = document.getElementById('inquiry');

  if (window.location.hash !== CONSULTATION_HASH) {
    window.location.hash = CONSULTATION_HASH;
  }

  window.dispatchEvent(
    new CustomEvent<{ formKey: ConsultationLeadForm }>(CONSULTATION_FORM_EVENT, {
      detail: { formKey },
    }),
  );

  requestAnimationFrame(() => {
    formPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

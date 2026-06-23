import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { useSiteSettings } from "./siteSettings";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const settings = useSiteSettings();

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Move focus into dialog on open */
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  /* Focus trap + ESC handler */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        trapFocus(dialogRef.current, e);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduce ? 0.15 : 0.3, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: reduce ? 0.1 : 0.22, ease: "easeIn" } },
  };

  const panelVariants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.95, y: 28 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.38, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      scale: reduce ? 1 : 0.97,
      y: reduce ? 0 : 14,
      transition: { duration: reduce ? 0.1 : 0.24, ease: "easeIn" },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ia-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog positioner */}
          <div
            className="ia-dialog-positioner"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              ref={dialogRef}
              className="ia-dialog glass-panel glass-panel--feature"
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-dialog-title"
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ maxWidth: "720px" }}
            >
              {/* Header */}
              <div className="ia-dialog-header">
                <div className="ia-dialog-title-row">
                  <span className="ia-dialog-kicker" aria-hidden="true">
                    Legal & Compliance
                  </span>
                  <h3 id="privacy-dialog-title" className="ia-dialog-title">
                    Privacy Policy
                  </h3>
                </div>
                <button
                  ref={closeRef}
                  className="ia-dialog-close"
                  onClick={onClose}
                  aria-label="Close Privacy Policy"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Policy Content */}
              <div
                className="privacy-content"
                style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  color: "var(--c-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
              >
                <p>
                  <strong>White Dot LLP</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting the privacy of our website visitors. This Privacy Policy describes how we collect, use, and safeguard personal information obtained through this website (<a href="https://whitedotindia.in" style={{ color: "var(--c-accent)", textDecoration: "underline" }}>whitedotindia.in</a>).
                </p>

                <h4 style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.05rem" }}>1. Information We Collect</h4>
                <p>
                  We collect personal information that you voluntarily provide to us when using the contact and procurement forms on our website (including General Inquiry, Request a Quote, Request a Sample, and Carbon Savings Calculator). This information may include:
                </p>
                <ul style={{ paddingLeft: "1.2rem", margin: "0" }}>
                  <li>Contact details: Name, Email Address, and Phone Number (including WhatsApp number).</li>
                  <li>Professional details: Company Name, Designation, and Business Location.</li>
                  <li>Procurement requirements: Material requirements, expected quantities (kg), and comments or inquiries.</li>
                </ul>

                <h4 style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.05rem" }}>2. How We Use Your Information</h4>
                <p>
                  The collected information is used solely to facilitate the supply chain and commercial process of LIMEX material solutions, including:
                </p>
                <ul style={{ paddingLeft: "1.2rem", margin: "0" }}>
                  <li>Responding to inquiries and technical questions.</li>
                  <li>Providing formal commercial quotes based on custom needs.</li>
                  <li>Processing and dispatching material trial samples to your company address.</li>
                  <li>Providing carbon savings analysis and optimization consultations.</li>
                </ul>

                <h4 style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.05rem" }}>3. Data Storage & Security</h4>
                <p>
                  We implement robust technical and organizational security measures to protect your personal information:
                  Our databases and backend are hosted on Hostinger VPS with role-based access controls and token authorizations (JWT) to secure administrative views. All form submissions are protected against spam via automated rate limiters and honeypot forms.
                </p>

                <h4 style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.05rem" }}>4. Authorized Sharing in the Supply Chain</h4>
                <p>
                  To deliver authentic LIMEX material, verify specifications, or coordinate logistics, we may share relevant information with the authorized partners within our supply chain:
                </p>
                <ul style={{ paddingLeft: "1.2rem", margin: "0" }}>
                  <li><strong>Seven Dot Company</strong>: The direct authorized distributor of LIMEX raw material.</li>
                  <li><strong>TBM Co., Ltd. (Japan)</strong>: The material inventor, manufacturer, and licensor.</li>
                </ul>
                <p>
                  We do not sell, rent, or lease your personal information to any third parties.
                </p>

                <h4 style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.05rem" }}>5. Your Rights & Contact Information</h4>
                <p>
                  You have the right to request access to, correction of, or deletion of the personal information we hold about you. For any privacy-related requests or questions, please contact us at:
                </p>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--c-line)" }}>
                  <strong>White Dot LLP</strong><br />
                  Email: <a href={`mailto:${settings.company_email}`} style={{ color: "var(--c-accent)", textDecoration: "underline" }}>{settings.company_email}</a><br />
                  Phone: {settings.company_phone}<br />
                  Location: {settings.company_address}
                </div>
              </div>

              <div className="ia-dialog-note">
                Last updated: June 5, 2026. White Dot LLP is an authorized marketing and sales firm for LIMEX material across Gujarat, Rajasthan, Diu, Daman, and Goa.
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LimexRock } from "./LimexRock";

// ─── Golden particle canvas ───────────────────────────────────────────────────
// 65 floating gold particles with radial glow halos. Canvas fills the full
// left panel; uses ResizeObserver so it stays crisp on resize.
function GoldenParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, animId = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * devicePixelRatio);
      canvas.height = Math.round(H * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    type P = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; phase: number };
    const pts: P[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.26,
      r: Math.random() * 2.0 + 0.55,
      alpha: Math.random() * 0.6 + 0.22,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const tick = () => {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        p.x += p.vx + Math.sin(t * 0.85 + p.phase) * 0.16;
        p.y += p.vy + Math.cos(t * 0.68 + p.phase) * 0.13;
        if (p.x < -10) p.x = W + 10;
        else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        else if (p.y > H + 10) p.y = -10;

        const a = p.alpha * (0.62 + 0.38 * Math.sin(t * 1.7 + p.phase));

        // Glow halo
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grd.addColorStop(0, `rgba(255,205,45,${(a * 0.52).toFixed(3)})`);
        grd.addColorStop(0.42, `rgba(255,180,15,${(a * 0.2).toFixed(3)})`);
        grd.addColorStop(1, "rgba(255,160,0,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,232,115,${a.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="cine-menu-particles" aria-hidden="true" />;
}

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: "#material", label: "Material" },
  { href: "#material-core", label: "Process" },
  { href: "#limex", label: "LIMEX" },
  { href: "#comparison", label: "Compare" },
  { href: "#applications", label: "Applications" },
  { href: "#consult", label: "Consultation" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
interface CinematicMenuProps {
  open: boolean;
  onClose: () => void;
  whatsappHref: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function CinematicMenu({ open, onClose, whatsappHref }: CinematicMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cine-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* ── Close — pinned to viewport top-right, above both panels ─────── */}
          <motion.button
            className="cine-menu-close"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <X size={18} />
          </motion.button>

          {/* ── Left panel — model + golden particles ─────────────────────── */}
          <motion.div
            className="cine-menu-left"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-108%" }}
            transition={{ duration: 0.62, ease }}
          >
            <GoldenParticles />
            <div className="cine-menu-rock-wrap">
              <LimexRock variant="is-menu" />
            </div>
            <div className="cine-menu-brand-tag" aria-hidden="true">
              <span className="cine-menu-brand-name">White Dot <small>LLP</small></span>
              <p className="cine-menu-brand-sub">Authorized LIMEX Marketing &amp; Sales</p>
            </div>
          </motion.div>

          {/* ── Right panel — nav links ────────────────────────────────────── */}
          <motion.div
            className="cine-menu-right"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.44, delay: 0.26, ease }}
          >
            <nav aria-label="Main navigation">
              <ul className="cine-menu-list">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.36 + i * 0.055, duration: 0.34, ease }}
                  >
                    <a href={link.href} className="cine-menu-link" onClick={onClose}>
                      <span className="cine-menu-link-idx">0{i + 1}</span>
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="cine-menu-cta-wrap"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.72, duration: 0.34, ease }}
              >
                <a
                  href={whatsappHref}
                  className="cine-btn cine-btn-primary"
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                >
                  Request Consultation
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.82, duration: 0.34, ease }}
                style={{ marginTop: "1.5rem", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".55rem" }}
              >
                <a
                  href="https://rajbhanderi107-droid.github.io/whitedot-limex.in/#/admin/login"
                  className="cine-menu-admin-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Always land on the login screen — clear any saved session
                    localStorage.removeItem("wd_admin_token");
                    onClose();
                  }}
                >
                  Admin Panel
                </a>
                <a
                  href="https://rajbhanderi107-droid.github.io/whitedot-limex.in/#/admin/google"
                  className="cine-menu-admin-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  Admin GoogleDash
                </a>
              </motion.div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

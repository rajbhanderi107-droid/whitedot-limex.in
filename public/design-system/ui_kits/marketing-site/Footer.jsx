/* Footer with brand + columns + base bar */
const Footer = () => (
  <footer className="cine-footer">
    <div className="cine-footer-inner">
      <div className="cine-footer-brand">
        <a className="cine-brand" href="#top">
          <img src="../../assets/whitedot-logo-enhanced.svg" alt="" width="30" height="30"/>
          <span>White Dot <small>LLP</small></span>
        </a>
        <p>
          Authorized marketing and sales firm for LIMEX material —
          limestone-based replacement for plastic and paper, made by TBM
          Japan.
        </p>
      </div>
      <div className="cine-footer-col">
        <h3>Material</h3>
        <a href="#material">Intelligence</a>
        <a href="#applications">Applications</a>
        <a href="#comparison">Compare</a>
      </div>
      <div className="cine-footer-col">
        <h3>Company</h3>
        <a href="#consult">Consultation</a>
        <a>Authorization</a>
        <a>Territory</a>
      </div>
      <div className="cine-footer-col">
        <h3>Contact</h3>
        <a href="https://wa.me/918849728938">+91 88497 28938</a>
        <a>rajbhanderi107@gmail.com</a>
        <a>Gujarat · Rajasthan · Diu · Daman</a>
      </div>
    </div>
    <div className="cine-footer-base">
      <span>© White Dot LLP · Authorized LIMEX Marketing & Sales</span>
      <span>TBM Japan → Seven Dot → White Dot LLP</span>
    </div>
  </footer>
);

window.Footer = Footer;

/* Google Analytics 4 for the standalone case-study pages — the same property
   and the same consent rules as the main site (index.html). Keep the two in
   step. These pages are where shared links and ads land, so without this a
   visitor arriving here was never counted. */
(function () {
  var GA_ID = 'G-0S4VPW9RGE';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  // Advertising measurement is on, so Google Ads can count enquiries
  // (generate_lead, contact_click) and build audiences. Visitors on a
  // European time zone stay opted out by default, as the law there requires
  // consent first. This is decided here rather than with gtag's own "region"
  // option: in testing, a region-scoped denial was applied to every visitor.
  // Keep index.html and public/case-study/js/analytics.js in step.
  var wdTimeZone = '';
  try { wdTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* unknown */ }
  var wdAds = /^(Europe|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))/.test(wdTimeZone) ? 'denied' : 'granted';
  gtag('consent', 'default', {
    ad_storage: wdAds,
    ad_user_data: wdAds,
    ad_personalization: wdAds,
    analytics_storage: 'granted',
  });
  gtag('js', new Date());
  gtag('config', GA_ID);
  // Most buyers reach out on WhatsApp or by phone rather than the form, so
  // those clicks are counted too. Mark "contact_click" as a key event in
  // Google Analytics to use it as an ad conversion alongside generate_lead.
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var method = /wa\.me|whatsapp\.com/i.test(href) ? 'whatsapp'
      : /^tel:/i.test(href) ? 'phone'
      : /^mailto:/i.test(href) ? 'email' : '';
    if (method) gtag('event', 'contact_click', { method: method, page_path: location.pathname });
  }, true);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();

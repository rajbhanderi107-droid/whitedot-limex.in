/* Google Analytics 4 for the standalone case-study pages — the same property
   and the same consent rules as the main site (index.html). Keep the two in
   step. These pages are where shared links and ads land, so without this a
   visitor arriving here was never counted. */
(function () {
  var GA_ID = 'G-0S4VPW9RGE';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  // Advertising measurement is on, so Google Ads can count enquiries and
  // build audiences. Visitors in the EEA, UK and Switzerland stay opted out
  // by default, as the law there requires consent first.
  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'],
  });
  gtag('js', new Date());
  gtag('config', GA_ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();

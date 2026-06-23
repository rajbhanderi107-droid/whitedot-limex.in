import { useEffect } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import News from './News';
import './NewsPage.css';

export default function NewsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="v2-root">
      <Nav />
      <main className="v2newspage">
        <header className="v2newspage-hero">
          <a className="v2newspage-back" href="#">← Back to White Dot</a>
          <p className="v2newspage-eyebrow">Newsroom</p>
          <h1 className="v2newspage-title">LIMEX &amp; TBM News</h1>
          <p className="v2newspage-sub">
            The latest from TBM Co., Ltd. (Japan) and White Dot's LIMEX work across India —
            synced automatically from the official TBM feed.
          </p>
        </header>
        <News full />
      </main>
      <Footer />
    </div>
  );
}

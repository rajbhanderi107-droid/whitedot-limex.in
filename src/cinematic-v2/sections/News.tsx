import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Radio, RefreshCw } from 'lucide-react';
import './News.css';
import { useReveal, useStaggerGroup } from '../motion';

type TbmNewsItem = {
  title: string;
  date: string;
  isoDate: string;
  category: string;
  tags: string[];
  href: string;
  image: string;
};

type TbmNewsFeed = {
  source: string;
  sourceUrl: string;
  syncedAt: string;
  items: TbmNewsItem[];
};

const FALLBACK_FEED: TbmNewsFeed = {
  source: 'TBM Co., Ltd.',
  sourceUrl: 'https://tb-m.com/eng/news/',
  syncedAt: '',
  items: [
    {
      title: 'TBM, Ligua, and Green Holding Sport have signed a memorandum of understanding to expand the "Dr.Supporter" product line in the Vietnamese market.',
      date: '2026.06.03',
      isoDate: '2026-06-03',
      category: 'Press release',
      tags: [],
      href: 'https://tb-m.com/eng/news/news-5295/',
      image: 'https://tb-m.com/app/uploads/2026/06/20260529_Sport_KV-300x157.jpg',
    },
    {
      title: 'TBM and analytical specialist Clearise are collaborating on the joint development of chemical management and quality assurance schemes for PCR-recycled material.',
      date: '2026.04.28',
      isoDate: '2026-04-28',
      category: 'Press release',
      tags: [],
      href: 'https://tb-m.com/eng/news/news-5126/',
      image: 'https://tb-m.com/app/uploads/2026/04/20260421_%E3%82%AF%E3%83%AA%E3%82%A2%E3%83%A9%E3%82%A4%E3%82%BA_KV-300x157.jpg',
    },
    {
      title: 'TBM\'s CCU Flooring material has been adopted for the stage at "SusHi Tech Tokyo 2026."',
      date: '2026.04.27',
      isoDate: '2026-04-27',
      category: 'Press release',
      tags: [],
      href: 'https://tb-m.com/eng/news/news-5118/',
      image: 'https://tb-m.com/app/uploads/2026/04/20260427_SPC_SushiTech-300x157.jpg',
    },
  ],
};

function formatSyncedAt(value: string) {
  if (!value) return 'Automatic TBM feed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Automatic TBM feed';
  return `Synced ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function News() {
  const [feed, setFeed] = useState<TbmNewsFeed>(FALLBACK_FEED);
  const heading = useReveal<HTMLDivElement>();
  const cards = useStaggerGroup<HTMLDivElement>();

  useEffect(() => {
    const controller = new AbortController();
    const newsUrl = `${import.meta.env.BASE_URL}data/tbm-news.json`;

    fetch(newsUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`News feed returned ${response.status}`);
        return response.json() as Promise<TbmNewsFeed>;
      })
      .then((payload) => {
        if (payload.items?.length) setFeed(payload);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.warn('Using bundled TBM news fallback.', error);
      });

    return () => controller.abort();
  }, []);

  const latestItems = useMemo(() => feed.items.slice(0, 4), [feed.items]);

  return (
    <section className="v2news v2-bg-light" id="news">
      <div className="v2news-inner">
        <div className="v2news-head v2-reveal" ref={heading.ref}>
          <div>
            <p className="v2-eyebrow">TBM News Sync</p>
            <h2 className="v2news-title">
              Global TBM updates,<br />
              connected to WhiteDot India.
            </h2>
          </div>
          <a className="v2news-source" href={feed.sourceUrl} target="_blank" rel="noreferrer">
            <RefreshCw aria-hidden="true" />
            <span>{formatSyncedAt(feed.syncedAt)}</span>
          </a>
        </div>

        <div className="v2news-layout">
          <article className="v2news-partnership">
            <div className="v2news-signal" aria-hidden="true">
              <Radio />
            </div>
            <p className="v2news-partnership-label">WhiteDot connectivity</p>
            <h3>India-side LIMEX access, application mapping and TBM-aligned material updates.</h3>
            <p>
              WhiteDot keeps Indian converters, brands and procurement teams connected with LIMEX
              developments from TBM while supporting local conversations around samples, use cases
              and manufacturable product routes.
            </p>
            <a className="v2news-partnership-link" href="#consultation">
              Discuss an application
              <ArrowUpRight aria-hidden="true" />
            </a>
          </article>

          <div className="v2news-list v2-reveal-group" ref={cards.ref}>
            {latestItems.map((item) => (
              <a className="v2news-card" href={item.href} target="_blank" rel="noreferrer" key={item.href}>
                <div className="v2news-thumb">
                  <img src={item.image} alt="" />
                </div>
                <div className="v2news-card-body">
                  <div className="v2news-meta">
                    <time dateTime={item.isoDate}>{item.date}</time>
                    <span>{item.category}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <span className="v2news-read">
                    Read on TBM
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

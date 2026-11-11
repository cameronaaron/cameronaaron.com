import { profile } from '@/data/profile';
import ProfileImage from '@/components/hero/ProfileImage';
import LocalTimeStatus from '@/components/ui/LocalTimeStatus';
import { getButtonStyles } from '@/components/ui/button-logic';
import { HERO_DISCIPLINES, splitHeroName } from '@/components/hero/hero-logic';

const { givenName, familyName, credentials } = splitHeroName(profile.name);

// Server Component. The hero is the LCP block and the first thing a reader
// judges, so it is plain HTML: no canvas, no pointer tracking, no scroll
// subscriptions, nothing to hydrate except the live clock. Its one load moment
// (the hi-vis block and the rules) is CSS and transform-only — see globals.css.
export default function Hero() {
  return (
    <section id="home" className="hero" aria-label="Hero section">
      <div className="container mx-auto px-6">
        <div className="hero-layout">
          <div className="hero-copy order-2 md:order-1">
            <p className="hero-availability">
              <span className="hero-availability-dot" aria-hidden="true" />
              <span>
                Open to connect<LocalTimeStatus />
                <span aria-hidden="true"> · </span>
                <span className="text-xs align-middle">{profile.citizenshipFlag}</span> {profile.citizenshipLabel}
              </span>
            </p>

            <h1 aria-label={profile.name} className="hero-name font-display">
              <span className="hero-name-line">{givenName}</span>
              <span className="hero-name-line hero-surname">
                {familyName}
                <span className="hero-credentials">{credentials}</span>
              </span>
            </h1>

            <p className="hero-title font-display">{profile.title}</p>
            <p className="hero-lede">{profile.tagline}</p>

            <div className="hero-actions">
              <a href="#selected-work" className={getButtonStyles('lg', 'primary')}>See selected work</a>
              <a href="#certifications" className={getButtonStyles('lg', 'secondary')}>View credentials</a>
              <a href="#contact" className={getButtonStyles('lg', 'secondary')}>Get in touch</a>
            </div>
          </div>

          <div className="hero-portrait order-1 md:order-2">
            <div className="relative">
              <div className="hero-portrait-block" aria-hidden="true" />
              <div className="hero-portrait-frame">
                <ProfileImage src="/images/profile-hero.avif" alt={profile.name} />
              </div>
            </div>
            <p className="hero-portrait-caption">{profile.location}</p>
          </div>
        </div>

        <div className="hero-disciplines">
          {HERO_DISCIPLINES.map((discipline) => (
            <a key={discipline.name} href={discipline.href} className="hero-discipline">
              <span className="hero-discipline-name">{discipline.name}</span>
              <h2 className="font-display">{discipline.title}</h2>
              <p>{discipline.description}</p>
              <span className="hero-discipline-action mark-link">{discipline.action}</span>
            </a>
          ))}
        </div>

        <dl className="hero-stats">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse justify-end">
              <dt className="hero-stat-label">{stat.label}</dt>
              <dd className="hero-stat-value font-display font-data">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

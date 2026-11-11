import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';
import { resumeDownloads } from '@/data/resume';
import SocialLink from '@/components/contact/SocialLink';
import { buildContactSocialLinks } from '@/components/contact/contact-logic';

// Server Component. The last section is three plain things — an address, two
// files, four links — so it is static HTML. It used to reveal its social links
// on a scroll-linked spring, which left the last of them half-transparent for
// anyone who stopped scrolling a little early; a link that is on the page is
// now simply on the page.
export default function Contact() {
  const socialLinks = buildContactSocialLinks(socialPlatforms, profile.social);

  return (
    <section id="contact" className="py-20 md:py-28" aria-labelledby="contact-heading">
      <div className="container mx-auto px-6">
        <div className="section-header">
          <h2 id="contact-heading" className="font-display">
            Let&rsquo;s connect
          </h2>
          <p>Open to healthcare, clinical research, and interdisciplinary collaboration opportunities.</p>
        </div>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Email</h3>
            <a
              href={`mailto:${profile.email}`}
              className="mark-link font-display inline break-all text-[clamp(1.5rem,4.2vw,3.25rem)] leading-tight text-foreground"
            >
              {profile.email}
            </a>

            <h3 className="mb-4 mt-12 text-sm font-semibold text-muted-foreground">Connect with me</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <SocialLink
                  key={social.key}
                  name={social.name}
                  platformKey={social.key}
                  url={social.url}
                  color={social.color}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Download my resume</h3>
            <div className="flex flex-col gap-3">
              {resumeDownloads.map((resume) => (
                <a
                  key={resume.key}
                  href={resume.href}
                  download={resume.downloadName}
                  className="glass-card group flex min-h-[44px] items-center gap-4 rounded-2xl px-5 py-4 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-200 group-hover:bg-accent">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">{resume.label}</span>
                    <span className="block text-sm text-muted-foreground">{resume.description}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

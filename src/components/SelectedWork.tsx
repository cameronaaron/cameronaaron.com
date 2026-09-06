import { capstone } from '@/data/capstone';

/** Static, keyboard-accessible entry points. The artwork responds entirely in CSS. */
export default function SelectedWork() {
  return (
    <section id="selected-work" className="selected-work" aria-labelledby="selected-work-heading">
      <div className="container mx-auto px-6">
        <div className="selected-work-heading">
          <div>
            <p className="selected-work-eyebrow">A few places to begin</p>
            <h2 id="selected-work-heading">Serious curiosity.<br /><span>Playful execution.</span></h2>
          </div>
          <p>Explore the work.<br />Then play with the ideas.</p>
        </div>

        <div className="selected-work-grid">
          <a className="work-door work-door-film" href="/capstone" aria-labelledby="work-film-title" aria-describedby="work-film-description">
            <div className="work-door-top"><span>01 / Education &amp; storytelling</span><span className="work-door-arrow" aria-hidden="true">↗</span></div>
            <div className="work-film-art" aria-hidden="true">
              <span className="work-film-frame work-film-frame-back" />
              <span className="work-film-frame work-film-frame-middle" />
              <span className="work-film-frame work-film-frame-front"><span>SEE THE<br /><em>whole</em><br />PERSON.</span></span>
            </div>
            <div className="work-door-copy">
              <p className="selected-work-eyebrow">A five-part educational video series</p>
              <h3 id="work-film-title">{capstone.shortTitle}</h3>
              <p id="work-film-description">Making the higher-education journey of thrice-exceptional Black male students visible.</p>
              <span className="work-door-action">Explore the capstone <span aria-hidden="true">↗</span></span>
            </div>
          </a>

          <a className="work-door work-door-play" href="#research-playground" aria-labelledby="work-play-title" aria-describedby="work-play-description">
            <div className="work-door-top"><span>02 / Research you can touch</span><span className="work-door-arrow" aria-hidden="true">↗</span></div>
            <div className="work-play-art" aria-hidden="true">
              <span className="work-play-orbit work-play-orbit-outer" />
              <span className="work-play-orbit work-play-orbit-inner" />
              <span className="work-play-core">what<br /><em>if?</em></span>
              <span className="work-play-point work-play-point-one" />
              <span className="work-play-point work-play-point-two" />
            </div>
            <div className="work-door-copy">
              <p className="selected-work-eyebrow">Interactive companions to the research</p>
              <h3 id="work-play-title">Follow your curiosity.</h3>
              <p id="work-play-description">Chase a robot. Think divergently. Keep a conversation alive. Explore ideas by playing with them.</p>
              <span className="work-door-action">Enter the playground <span aria-hidden="true">↗</span></span>
            </div>
          </a>
        </div>
        <div className="selected-work-footer"><a href="#contact">Have something in mind? Let’s talk <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
  );
}

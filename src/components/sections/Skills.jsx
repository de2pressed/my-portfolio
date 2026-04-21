'use client';

import useRevealMotion from '../../hooks/useRevealMotion';
import useSiteContent from '../../hooks/useSiteContent';
import styles from './Skills.module.css';

export default function Skills() {
  const ref = useRevealMotion();
  const { skills } = useSiteContent();

  return (
    <section data-component="Skills" ref={ref} className={styles.wrapper} id="skills">
      <div className={styles.copy}>
        <p className="section-label">Tech stack</p>
        <h2>Glass orbs instead of dead bars.</h2>
      </div>

      <div className={styles.orbs}>
        {skills.map((skill) => (
          <button
            key={skill.id}
            type="button"
            className={styles.orb}
            style={{
              '--orb-size': `${6.2 + skill.weight / 16}rem`,
            }}
          >
            <span className={styles.orbWeight}>{skill.weight}</span>
            <strong>{skill.label}</strong>
            <small>{skill.category}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

import styles from './GlassOrb.module.css';

/**
 * @param {{
 *   className?: string,
 *   label?: string,
 *   size?: 'sm' | 'md' | 'lg'
 * }} props
 */
export default function GlassOrb({
  className = '',
  label = 'Glass Orb',
  size = 'md',
}) {
  return (
    <div
      data-component="GlassOrb"
      className={`${styles.wrapper} ${styles[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <div className={styles.core} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

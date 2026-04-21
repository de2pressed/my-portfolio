import styles from './GlassCard.module.css';

/**
 * @param {{
 *   children?: import('react').ReactNode,
 *   className?: string,
 *   title?: string
 * }} props
 */
export default function GlassCard({ children, className = '', title = '' }) {
  return (
    <div
      data-component="GlassCard"
      className={`${styles.wrapper} ${className}`.trim()}
    >
      {title ? <p className={styles.label}>{title}</p> : null}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

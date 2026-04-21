import styles from './GlassButton.module.css';

/**
 * @param {{
 *   children?: import('react').ReactNode,
 *   className?: string,
 *   disabled?: boolean,
 *   onClick?: import('react').MouseEventHandler<HTMLButtonElement>,
 *   type?: 'button' | 'submit' | 'reset'
 * }} props
 */
export default function GlassButton({
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) {
  return (
    <div data-component="GlassButton" className={styles.wrapper}>
      <button
        className={`${styles.button} ${className}`.trim()}
        disabled={disabled}
        onClick={onClick}
        type={type}
      >
        {children || 'Glass Button'}
      </button>
    </div>
  );
}

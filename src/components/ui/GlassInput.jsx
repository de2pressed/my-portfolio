import styles from './GlassInput.module.css';

/**
 * @param {{
 *   className?: string,
 *   name?: string,
 *   onChange?: import('react').ChangeEventHandler<HTMLInputElement>,
 *   placeholder?: string,
 *   type?: string,
 *   value?: string
 * }} props
 */
export default function GlassInput({
  className = '',
  name,
  onChange,
  placeholder = 'Glass input',
  type = 'text',
  value = '',
}) {
  return (
    <div data-component="GlassInput" className={styles.wrapper}>
      <input
        className={`${styles.input} ${className}`.trim()}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

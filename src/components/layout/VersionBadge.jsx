import styles from './VersionBadge.module.css';
import { SITE_VERSION } from '../../lib/version';

export default function VersionBadge() {
  return (
    <div data-component="VersionBadge" className={styles.wrapper}>
      {SITE_VERSION}
    </div>
  );
}

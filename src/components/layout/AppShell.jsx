'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import styles from './AppShell.module.css';
import LoadingScreen from '../gateway/LoadingScreen';
import CookieDialog from '../gateway/CookieDialog';
import AdminRevealOverlay from '../gateway/AdminRevealOverlay';
import AdminProvider, { useAdmin } from '../../context/AdminContext';
import AnalyticsProvider from '../../context/AnalyticsContext';
import CookieProvider from '../../context/CookieContext';
import MusicProvider from '../../context/MusicContext';
import SiteContentProvider from '../../context/SiteContentContext';
import ThemeProvider from '../../context/ThemeContext';
import GlassCursor from '../ui/GlassCursor';
import MusicPlayer from './MusicPlayer';
import AmbientBackground from './AmbientBackground';
import VersionBadge from './VersionBadge';
import useAdminKeyTrigger from '../../hooks/useAdminKeyTrigger';
import useCookieConsent from '../../hooks/useCookieConsent';
import useMusic from '../../hooks/useMusic';
import useSiteContent from '../../hooks/useSiteContent';

function AppChrome({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const stageRef = useRef(null);
  const [isAdminRevealActive, setIsAdminRevealActive] = useState(false);
  const adminRevealTimerRef = useRef(null);
  const adminRevealCleanupRef = useRef(null);
  const [gatewayPhase, setGatewayPhase] = useState('loading');
  const [didPlayerTimeout, setDidPlayerTimeout] = useState(false);
  const { isValidating, validateSession } = useAdmin();
  const {
    hasSeenCookieTransition,
    markCookieTransitionSeen,
    requiresConsent,
    setConsent,
  } = useCookieConsent();
  const { isLoading: isContentLoading } = useSiteContent();
  const { isPlayerReady, isPlayerUnavailable, unlockAndPlay } = useMusic();

  const showPublicChrome =
    !pathname.startsWith('/admin') && pathname !== '/admin-login';

  useAdminKeyTrigger(() => {
    if (
      pathname === '/admin-login' ||
      pathname.startsWith('/admin') ||
      isAdminRevealActive
    ) {
      return;
    }

    setIsAdminRevealActive(true);
    document.body.classList.add('overlay-active');

    window.clearTimeout(adminRevealTimerRef.current);
    window.clearTimeout(adminRevealCleanupRef.current);
    adminRevealTimerRef.current = window.setTimeout(() => {
      router.push('/admin-login');
    }, 460);

    adminRevealCleanupRef.current = window.setTimeout(() => {
      setIsAdminRevealActive(false);
      document.body.classList.remove('overlay-active');
    }, 1080);
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDidPlayerTimeout(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      void validateSession();
    }
  }, [pathname, validateSession]);

  useEffect(() => {
    const canProceed =
      !isValidating &&
      !isContentLoading &&
      (isPlayerReady || isPlayerUnavailable || didPlayerTimeout);

    if (gatewayPhase === 'loading' && canProceed) {
      setGatewayPhase('enter');
    }
  }, [
    didPlayerTimeout,
    gatewayPhase,
    isContentLoading,
    isPlayerReady,
    isPlayerUnavailable,
    isValidating,
  ]);

  useLayoutEffect(() => {
    const element = stageRef.current;

    if (!element) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 16 },
        { duration: 0.95, ease: 'power4.out', opacity: 1, y: 0 },
      );
    }, element);

    return () => context.revert();
  }, [pathname]);

  useEffect(() => {
    const shouldLockBody =
      gatewayPhase !== 'complete' ||
      (requiresConsent && gatewayPhase === 'cookie') ||
      isAdminRevealActive;

    document.body.classList.toggle('overlay-active', shouldLockBody);

    return () => {
      document.body.classList.remove('overlay-active');
    };
  }, [gatewayPhase, isAdminRevealActive, requiresConsent]);

  useEffect(
    () => () => {
      window.clearTimeout(adminRevealTimerRef.current);
      window.clearTimeout(adminRevealCleanupRef.current);
    },
    [],
  );

  const handleEnter = async () => {
    await unlockAndPlay();

    if (requiresConsent) {
      if (!hasSeenCookieTransition) {
        markCookieTransitionSeen();
      }

      setGatewayPhase(hasSeenCookieTransition ? 'cookie' : 'cookie-transition');

      window.setTimeout(() => {
        setGatewayPhase('cookie');
      }, 420);
      return;
    }

    setGatewayPhase('complete');
  };

  const handleConsent = (value) => {
    setConsent(value);
    setGatewayPhase('complete');
  };

  const showGateway = gatewayPhase !== 'complete';
  const showCookie = gatewayPhase === 'cookie' && requiresConsent;

  return (
    <div className={styles.appShell}>
      <AmbientBackground />
      <GlassCursor />
      <AdminRevealOverlay active={isAdminRevealActive} />
      {showPublicChrome ? <MusicPlayer /> : null}
      <VersionBadge />

      {showGateway ? (
        <LoadingScreen
          detail={
            gatewayPhase === 'enter'
              ? 'The YouTube engine is awake. Enter to begin the atmosphere.'
              : 'Loading music, syncing the ambient palette, and stitching the footer dock.'
          }
          label="Premium portfolio gateway"
          mode={gatewayPhase}
          onEnter={handleEnter}
          ready={gatewayPhase === 'enter'}
        />
      ) : null}

      {showCookie ? (
        <CookieDialog
          onAccept={() => handleConsent('accepted')}
          onReject={() => handleConsent('rejected')}
        />
      ) : null}

      <div
        ref={stageRef}
        className={`${styles.contentShell} ${
          showGateway || showCookie ? styles.blocked : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function AppShell({ children, initialContent }) {
  return (
    <ThemeProvider>
      <SiteContentProvider initialContent={initialContent}>
        <MusicProvider>
          <CookieProvider>
            <AdminProvider>
              <AnalyticsProvider>
                <AppChrome>{children}</AppChrome>
              </AnalyticsProvider>
            </AdminProvider>
          </CookieProvider>
        </MusicProvider>
      </SiteContentProvider>
    </ThemeProvider>
  );
}

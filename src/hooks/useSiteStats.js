import { useAnalytics } from '../context/AnalyticsContext';

export default function useSiteStats() {
  return useAnalytics();
}

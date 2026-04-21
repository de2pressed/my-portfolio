import { notFound } from 'next/navigation';
import WorkDetailPage from '../../../components/work/WorkDetail';
import { getWorkBySlug } from '../../../lib/content-store';

export default async function WorkDetailRoutePage({ params }) {
  const work = await getWorkBySlug(params.slug);

  if (!work) {
    notFound();
  }

  return <WorkDetailPage work={work} />;
}

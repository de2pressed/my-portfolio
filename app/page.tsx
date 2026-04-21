import { PublicHome } from "@/components/sections/PublicHome";
import { getPublicPortfolioData } from "@/lib/content-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPublicPortfolioData();
  return <PublicHome data={data} />;
}

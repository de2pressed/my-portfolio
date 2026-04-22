import { PublicHome } from "@/components/sections/PublicHome";
import { getPublicPortfolioData } from "@/lib/content-repository";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const data = await getPublicPortfolioData();
  return <PublicHome data={data} />;
}

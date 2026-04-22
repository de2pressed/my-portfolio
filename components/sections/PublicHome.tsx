"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useCookie } from "@/context/CookieContext";
import { createAdminKeyListener } from "@/lib/adminKeyListener";
import {
  trackPageView,
  trackSectionScroll,
  trackSessionEnd,
  trackSessionStart,
} from "@/lib/analytics";
import type { PortfolioData } from "@/lib/types";
import { getSiteContentValue } from "@/lib/utils";

// Lazy load below-fold sections for code splitting
const About = dynamic(() => import("@/components/sections/About").then(mod => mod.About), {
  loading: () => <div className="h-96 animate-pulse bg-[rgba(10,10,14,0.3)]" />,
});

const Experience = dynamic(() => import("@/components/sections/Experience").then(mod => mod.Experience), {
  loading: () => <div className="h-96 animate-pulse bg-[rgba(10,10,14,0.3)]" />,
});

const Projects = dynamic(() => import("@/components/sections/Projects").then(mod => mod.Projects), {
  loading: () => <div className="h-96 animate-pulse bg-[rgba(10,10,14,0.3)]" />,
});

const Reviews = dynamic(() => import("@/components/sections/Reviews").then(mod => mod.Reviews), {
  loading: () => <div className="h-96 animate-pulse bg-[rgba(10,10,14,0.3)]" />,
});

const Skills = dynamic(() => import("@/components/sections/Skills").then(mod => mod.Skills), {
  loading: () => <div className="h-96 animate-pulse bg-[rgba(10,10,14,0.3)]" />,
});

type PublicHomeProps = {
  data: PortfolioData;
};

export function PublicHome({ data }: PublicHomeProps) {
  const router = useRouter();
  const { analyticsEnabled } = useCookie();

  const name = String(getSiteContentValue(data.siteContent, "hero_name", "Jayant Kumar"));
  const tagline = String(
    getSiteContentValue(
      data.siteContent,
      "hero_tagline",
      "DevOps-focused developer shaping infrastructure into immersive, reliable systems.",
    ),
  );
  const intro = String(
    getSiteContentValue(
      data.siteContent,
      "hero_intro",
      "I build deployment flows, containerized platforms, and observability layers that feel as considered as the products they support.",
    ),
  );
  const about = String(getSiteContentValue(data.siteContent, "about", ""));
  const location = String(getSiteContentValue(data.siteContent, "location", "Gurugram, India"));
  const email = String(getSiteContentValue(data.siteContent, "email", "jayantdahiya1204@gmail.com"));
  const phone = String(getSiteContentValue(data.siteContent, "phone", "9560573648"));
  const footerNote = String(getSiteContentValue(data.siteContent, "footer_note", ""));
  const education = getSiteContentValue(data.siteContent, "education", {
    degree: "",
    institution: "",
    duration: "",
  }) as {
    degree: string;
    institution: string;
    duration: string;
  };

  useEffect(() => {
    const handler = createAdminKeyListener(() => router.push("/admin/login"));
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  useEffect(() => {
    if (!analyticsEnabled) {
      return;
    }

    void trackSessionStart("/");
    void trackPageView("/");

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("data-section");
            if (section) {
              void trackSectionScroll(section);
            }
            currentObserver.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.35,
      },
    );

    document.querySelectorAll("[data-section]").forEach((section) => observer.observe(section));

    const handleSessionEnd = () => {
      void trackSessionEnd("/");
    };

    window.addEventListener("beforeunload", handleSessionEnd);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSessionEnd();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("beforeunload", handleSessionEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [analyticsEnabled]);

  return (
    <main className="relative z-10 pb-8">
      <Header name={name} />
      <Hero email={email} intro={intro} location={location} name={name} phone={phone} tagline={tagline} />
      <About education={education} summary={about} />
      <Skills skills={data.skills} />
      <Experience experience={data.experience} />
      <Projects projects={data.projects} />
      <Reviews reviews={data.reviews} />
      <Footer email={email} name={name} note={footerNote} />
    </main>
  );
}

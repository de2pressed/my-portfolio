import type {
  AnalyticsEvent,
  ExperienceEntry,
  PortfolioData,
  ProjectEntry,
  ReviewEntry,
  SettingEntry,
  SiteContentEntry,
  SkillEntry,
} from "@/lib/types";

const now = "2026-04-21T00:00:00.000Z";

export const DEFAULT_MUSIC_URL =
  "https://www.youtube.com/watch?v=ZAz3rnLGthg&list=RDZAz3rnLGthg";

export const DEFAULT_SITE_VERSION = "v1.0.2";

export const seededSiteContent: SiteContentEntry[] = [
  {
    id: "hero-name",
    section: "hero_name",
    content: "Jayant Kumar",
    updated_at: now,
  },
  {
    id: "hero-tagline",
    section: "hero_tagline",
    content: "DevOps-focused developer shaping infrastructure into immersive, reliable systems.",
    updated_at: now,
  },
  {
    id: "hero-intro",
    section: "hero_intro",
    content:
      "I build deployment flows, containerized platforms, and observability layers that feel as considered as the products they support.",
    updated_at: now,
  },
  {
    id: "about",
    section: "about",
    content:
      "DevOps-focused BCA undergraduate with hands-on experience building, automating, and deploying CI/CD pipelines, containerized applications, DevSecOps security scans, and monitoring solutions on AWS using Jenkins, Docker, Prometheus, and Grafana.",
    updated_at: now,
  },
  {
    id: "identity-location",
    section: "location",
    content: "Gurugram, India",
    updated_at: now,
  },
  {
    id: "identity-email",
    section: "email",
    content: "jayantdahiya1204@gmail.com",
    updated_at: now,
  },
  {
    id: "identity-phone",
    section: "phone",
    content: "9560573648",
    updated_at: now,
  },
  {
    id: "education",
    section: "education",
    content: {
      degree: "Bachelor of Computer Applications (BCA)",
      institution: "SAITM Gurugram (Affiliated to MDU)",
      duration: "2024-2027 (Expected)",
    },
    updated_at: now,
  },
  {
    id: "footer-note",
    section: "footer_note",
    content:
      "Comfortable with Linux environments, CI/CD workflows, DevSecOps practices, and monitoring-driven operations.",
    updated_at: now,
  },
];

export const seededSkills: SkillEntry[] = [
  {
    id: "skill-aws-ec2",
    name: "AWS EC2",
    category: "Cloud & OS",
    icon: "Cloud",
    sort_order: 1,
    created_at: now,
  },
  {
    id: "skill-aws-iam",
    name: "AWS IAM (basic)",
    category: "Cloud & OS",
    icon: "Shield",
    sort_order: 2,
    created_at: now,
  },
  {
    id: "skill-ubuntu",
    name: "Ubuntu Linux 24.04",
    category: "Cloud & OS",
    icon: "Terminal",
    sort_order: 3,
    created_at: now,
  },
  {
    id: "skill-jenkins",
    name: "Jenkins (Declarative Pipelines)",
    category: "CI/CD & Version Control",
    icon: "Workflow",
    sort_order: 4,
    created_at: now,
  },
  {
    id: "skill-git",
    name: "Git",
    category: "CI/CD & Version Control",
    icon: "GitBranch",
    sort_order: 5,
    created_at: now,
  },
  {
    id: "skill-github",
    name: "GitHub",
    category: "CI/CD & Version Control",
    icon: "Github",
    sort_order: 6,
    created_at: now,
  },
  {
    id: "skill-docker",
    name: "Docker",
    category: "Containers & DevSecOps",
    icon: "Package",
    sort_order: 7,
    created_at: now,
  },
  {
    id: "skill-dockerhub",
    name: "Docker Hub",
    category: "Containers & DevSecOps",
    icon: "Box",
    sort_order: 8,
    created_at: now,
  },
  {
    id: "skill-sonarqube",
    name: "SonarQube",
    category: "Containers & DevSecOps",
    icon: "ScanSearch",
    sort_order: 9,
    created_at: now,
  },
  {
    id: "skill-trivy",
    name: "Trivy",
    category: "Containers & DevSecOps",
    icon: "ShieldAlert",
    sort_order: 10,
    created_at: now,
  },
  {
    id: "skill-depcheck",
    name: "OWASP Dependency-Check",
    category: "Containers & DevSecOps",
    icon: "Bug",
    sort_order: 11,
    created_at: now,
  },
  {
    id: "skill-dockerscout",
    name: "Docker Scout",
    category: "Containers & DevSecOps",
    icon: "Radar",
    sort_order: 12,
    created_at: now,
  },
  {
    id: "skill-prometheus",
    name: "Prometheus",
    category: "Monitoring & Observability",
    icon: "Activity",
    sort_order: 13,
    created_at: now,
  },
  {
    id: "skill-nodeexporter",
    name: "Node Exporter",
    category: "Monitoring & Observability",
    icon: "Server",
    sort_order: 14,
    created_at: now,
  },
  {
    id: "skill-grafana",
    name: "Grafana",
    category: "Monitoring & Observability",
    icon: "BarChart3",
    sort_order: 15,
    created_at: now,
  },
  {
    id: "skill-java",
    name: "Java 21",
    category: "Languages & Runtimes",
    icon: "Coffee",
    sort_order: 16,
    created_at: now,
  },
  {
    id: "skill-node",
    name: "Node.js 25",
    category: "Languages & Runtimes",
    icon: "Orbit",
    sort_order: 17,
    created_at: now,
  },
  {
    id: "skill-javascript",
    name: "JavaScript",
    category: "Languages & Runtimes",
    icon: "FileCode2",
    sort_order: 18,
    created_at: now,
  },
  {
    id: "skill-bash",
    name: "Bash",
    category: "Languages & Runtimes",
    icon: "Binary",
    sort_order: 19,
    created_at: now,
  },
  {
    id: "skill-aws-cli",
    name: "AWS CLI",
    category: "Tools",
    icon: "Command",
    sort_order: 20,
    created_at: now,
  },
  {
    id: "skill-systemd",
    name: "systemd",
    category: "Tools",
    icon: "Gauge",
    sort_order: 21,
    created_at: now,
  },
  {
    id: "skill-npm",
    name: "NPM",
    category: "Tools",
    icon: "PackageSearch",
    sort_order: 22,
    created_at: now,
  },
];

export const seededExperience: ExperienceEntry[] = [
  {
    id: "experience-devsecops-zomato",
    title: "End-to-End DevSecOps CI/CD Pipeline - Zomato Clone",
    organization: "Personal Project",
    date_range: "2026",
    description: [
      "Designed and implemented an automated CI/CD pipeline for a Node.js application using Jenkins declarative pipelines.",
      "Provisioned and configured AWS EC2 infrastructure including Linux services, networking, and port management.",
      "Integrated SonarQube static code analysis and enforced quality gates before container image creation.",
      "Implemented DevSecOps security scans using OWASP Dependency-Check, Trivy filesystem scans, and Docker Scout.",
      "Containerized the application and automated Docker image build, tag, and push to Docker Hub.",
      "Deployed the application as a Docker container on EC2 and validated runtime and port exposure.",
      "Built a centralized monitoring stack by configuring Prometheus and Node Exporter as systemd services.",
      "Integrated Jenkins and host metrics into Prometheus using custom scrape configurations.",
      "Visualized infrastructure and CI/CD metrics using Grafana dashboards.",
      "Used Java 21 and Node.js 25, adapting pipelines beyond tutorial-default runtime versions.",
    ],
    link: "https://github.com/de2pressed/Zomato-devops-project.git",
    sort_order: 1,
    created_at: now,
  },
  {
    id: "experience-education",
    title: "Bachelor of Computer Applications (BCA)",
    organization: "SAITM Gurugram (Affiliated to MDU)",
    date_range: "2024-2027 (Expected)",
    description: [
      "Focused on software systems, deployment practices, and hands-on operational tooling.",
      "Shaping a practical DevOps profile through continuous project work and system experimentation.",
    ],
    link: null,
    sort_order: 2,
    created_at: now,
  },
];

export const seededProjects: ProjectEntry[] = [
  {
    id: "project-zomato-devsecops",
    title: "End-to-End DevSecOps CI/CD Pipeline - Zomato Clone",
    description: [
      "Automated a full Jenkins-driven CI/CD lifecycle for a Node.js application.",
      "Layered in code quality gates, container security scanning, image publishing, deployment, and runtime monitoring.",
      "Tied Jenkins, Prometheus, Node Exporter, and Grafana into one operational loop on AWS EC2.",
    ],
    tech_stack: [
      "Jenkins",
      "Docker",
      "AWS EC2",
      "SonarQube",
      "Trivy",
      "OWASP Dependency-Check",
      "Docker Scout",
      "Prometheus",
      "Grafana",
      "Node.js 25",
      "Java 21",
    ],
    link: "https://github.com/de2pressed/Zomato-devops-project.git",
    image_url: null,
    sort_order: 1,
    created_at: now,
  },
];

export const seededReviews: ReviewEntry[] = [
  {
    id: "review-launch",
    email: "hello@example.com",
    display_name: "Launch Visitor",
    message:
      "The atmosphere feels deliberate. The site already reads like a portfolio with a pulse instead of a static resume.",
    created_at: now,
    is_visible: true,
  },
];

export const seededSettings: SettingEntry[] = [
  {
    id: "setting-music",
    key: "music_url",
    value: DEFAULT_MUSIC_URL,
    updated_at: now,
  },
  {
    id: "setting-version",
    key: "site_version",
    value: DEFAULT_SITE_VERSION,
    updated_at: now,
  },
];

export const seededAnalyticsEvents: AnalyticsEvent[] = [];

export const seededPortfolioData: PortfolioData = {
  siteContent: seededSiteContent,
  skills: seededSkills,
  experience: seededExperience,
  projects: seededProjects,
  reviews: seededReviews,
  settings: seededSettings,
};

insert into public.site_content (id, section, content, updated_at)
values
  ('hero-name', 'hero_name', '"Jayant Kumar"', timezone('utc', now())),
  ('hero-tagline', 'hero_tagline', '"DevOps-focused developer shaping infrastructure into immersive, reliable systems."', timezone('utc', now())),
  ('hero-intro', 'hero_intro', '"I build deployment flows, containerized platforms, and observability layers that feel as considered as the products they support."', timezone('utc', now())),
  ('about', 'about', '"DevOps-focused BCA undergraduate with hands-on experience building, automating, and deploying CI/CD pipelines, containerized applications, DevSecOps security scans, and monitoring solutions on AWS using Jenkins, Docker, Prometheus, and Grafana."', timezone('utc', now())),
  ('identity-location', 'location', '"Gurugram, India"', timezone('utc', now())),
  ('identity-email', 'email', '"jayantdahiya1204@gmail.com"', timezone('utc', now())),
  ('identity-phone', 'phone', '"9560573648"', timezone('utc', now())),
  ('education', 'education', '{"degree":"Bachelor of Computer Applications (BCA)","institution":"SAITM Gurugram (Affiliated to MDU)","duration":"2024-2027 (Expected)"}', timezone('utc', now())),
  ('footer-note', 'footer_note', '"Comfortable with Linux environments, CI/CD workflows, DevSecOps practices, and monitoring-driven operations."', timezone('utc', now()))
on conflict (id) do update
set content = excluded.content,
    updated_at = excluded.updated_at;

insert into public.skills (id, name, category, icon, sort_order, created_at)
values
  ('skill-aws-ec2', 'AWS EC2', 'Cloud & OS', 'Cloud', 1, timezone('utc', now())),
  ('skill-aws-iam', 'AWS IAM (basic)', 'Cloud & OS', 'Shield', 2, timezone('utc', now())),
  ('skill-ubuntu', 'Ubuntu Linux 24.04', 'Cloud & OS', 'Terminal', 3, timezone('utc', now())),
  ('skill-jenkins', 'Jenkins (Declarative Pipelines)', 'CI/CD & Version Control', 'Workflow', 4, timezone('utc', now())),
  ('skill-git', 'Git', 'CI/CD & Version Control', 'GitBranch', 5, timezone('utc', now())),
  ('skill-github', 'GitHub', 'CI/CD & Version Control', 'Github', 6, timezone('utc', now())),
  ('skill-docker', 'Docker', 'Containers & DevSecOps', 'Package', 7, timezone('utc', now())),
  ('skill-dockerhub', 'Docker Hub', 'Containers & DevSecOps', 'Box', 8, timezone('utc', now())),
  ('skill-sonarqube', 'SonarQube', 'Containers & DevSecOps', 'ScanSearch', 9, timezone('utc', now())),
  ('skill-trivy', 'Trivy', 'Containers & DevSecOps', 'ShieldAlert', 10, timezone('utc', now())),
  ('skill-depcheck', 'OWASP Dependency-Check', 'Containers & DevSecOps', 'Bug', 11, timezone('utc', now())),
  ('skill-dockerscout', 'Docker Scout', 'Containers & DevSecOps', 'Radar', 12, timezone('utc', now())),
  ('skill-prometheus', 'Prometheus', 'Monitoring & Observability', 'Activity', 13, timezone('utc', now())),
  ('skill-nodeexporter', 'Node Exporter', 'Monitoring & Observability', 'Server', 14, timezone('utc', now())),
  ('skill-grafana', 'Grafana', 'Monitoring & Observability', 'BarChart3', 15, timezone('utc', now())),
  ('skill-java', 'Java 21', 'Languages & Runtimes', 'Coffee', 16, timezone('utc', now())),
  ('skill-node', 'Node.js 25', 'Languages & Runtimes', 'Orbit', 17, timezone('utc', now())),
  ('skill-javascript', 'JavaScript', 'Languages & Runtimes', 'FileCode2', 18, timezone('utc', now())),
  ('skill-bash', 'Bash', 'Languages & Runtimes', 'Binary', 19, timezone('utc', now())),
  ('skill-aws-cli', 'AWS CLI', 'Tools', 'Command', 20, timezone('utc', now())),
  ('skill-systemd', 'systemd', 'Tools', 'Gauge', 21, timezone('utc', now())),
  ('skill-npm', 'NPM', 'Tools', 'PackageSearch', 22, timezone('utc', now()))
on conflict (id) do nothing;

insert into public.experience (id, title, organization, date_range, description, link, sort_order, created_at)
values
  (
    'experience-devsecops-zomato',
    'End-to-End DevSecOps CI/CD Pipeline - Zomato Clone',
    'Personal Project',
    '2026',
    '["Designed and implemented an automated CI/CD pipeline for a Node.js application using Jenkins declarative pipelines.","Provisioned and configured AWS EC2 infrastructure including Linux services, networking, and port management.","Integrated SonarQube static code analysis and enforced quality gates before container image creation.","Implemented DevSecOps security scans using OWASP Dependency-Check, Trivy filesystem scans, and Docker Scout.","Containerized the application and automated Docker image build, tag, and push to Docker Hub.","Deployed the application as a Docker container on EC2 and validated runtime and port exposure.","Built a centralized monitoring stack by configuring Prometheus and Node Exporter as systemd services.","Integrated Jenkins and host metrics into Prometheus using custom scrape configurations.","Visualized infrastructure and CI/CD metrics using Grafana dashboards.","Used Java 21 and Node.js 25, adapting pipelines beyond tutorial-default runtime versions."]',
    'https://github.com/de2pressed/Zomato-devops-project.git',
    1,
    timezone('utc', now())
  ),
  (
    'experience-education',
    'Bachelor of Computer Applications (BCA)',
    'SAITM Gurugram (Affiliated to MDU)',
    '2024-2027 (Expected)',
    '["Focused on software systems, deployment practices, and hands-on operational tooling.","Shaping a practical DevOps profile through continuous project work and system experimentation."]',
    null,
    2,
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.projects (id, title, description, tech_stack, link, image_url, sort_order, created_at)
values
  (
    'project-zomato-devsecops',
    'End-to-End DevSecOps CI/CD Pipeline - Zomato Clone',
    '["Automated a full Jenkins-driven CI/CD lifecycle for a Node.js application.","Layered in code quality gates, container security scanning, image publishing, deployment, and runtime monitoring.","Tied Jenkins, Prometheus, Node Exporter, and Grafana into one operational loop on AWS EC2."]',
    array['Jenkins','Docker','AWS EC2','SonarQube','Trivy','OWASP Dependency-Check','Docker Scout','Prometheus','Grafana','Node.js 25','Java 21'],
    'https://github.com/de2pressed/Zomato-devops-project.git',
    null,
    1,
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.reviews (id, email, display_name, message, created_at, is_visible)
values
  (
    'review-launch',
    'hello@example.com',
    'Launch Visitor',
    'The atmosphere feels deliberate. The site already reads like a portfolio with a pulse instead of a static resume.',
    timezone('utc', now()),
    true
  )
on conflict (id) do nothing;

insert into public.settings (id, key, value, updated_at)
values
  ('setting-music', 'music_url', 'https://www.youtube.com/watch?v=cxKs2b5lRsA&list=PLszOYbYuCZu74Y2HQh8m14HzSXAnMMwHt', timezone('utc', now())),
  ('setting-version', 'site_version', 'v1.0.3', timezone('utc', now()))
on conflict (id) do update
set value = excluded.value,
    updated_at = excluded.updated_at;

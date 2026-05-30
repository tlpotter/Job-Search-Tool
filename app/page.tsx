import { JobFeed } from "@/components/job-feed";
import { AppHeader } from "@/components/app-header";

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <AppHeader />
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-10 pb-16">
        <div className="mb-10">
          <div className="eyebrow mb-3">Feed</div>
          <h1 className="serif-heading text-[clamp(36px,4vw,52px)]">
            Senior &amp; Staff <em>roles</em>
          </h1>
        </div>
        <JobFeed />
      </div>
    </div>
  );
}

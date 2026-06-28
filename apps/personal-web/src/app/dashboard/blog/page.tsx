import { PageHeader } from "@/components/page-header";
import { Calendar, Clock, ArrowRight, Hash, User } from "lucide-react";

const posts = [
  {
    title: "Introducing Real-Time Analytics Dashboard",
    excerpt: "We are excited to announce our new real-time analytics dashboard that gives you instant insights into your platform performance, user behavior, and revenue trends with zero latency.",
    date: "Jun 15, 2026",
    readTime: "5 min read",
    author: "John Doe",
    tags: ["Product", "Feature"],
  },
  {
    title: "Security Enhancements: Two-Factor Authentication Now Available",
    excerpt: "Protect your account with an extra layer of security. Our new two-factor authentication system supports authenticator apps, SMS codes, and hardware security keys.",
    date: "Jun 10, 2026",
    readTime: "4 min read",
    author: "Sarah Chen",
    tags: ["Security", "Update"],
  },
  {
    title: "How We Reduced API Latency by 40%",
    excerpt: "A deep dive into our infrastructure optimization journey — from connection pooling and query optimization to edge caching, here is how we made your API calls faster.",
    date: "Jun 3, 2026",
    readTime: "8 min read",
    author: "Mike Johnson",
    tags: ["Engineering", "Performance"],
  },
  {
    title: "Q2 2026 Platform Report: Growth & Milestones",
    excerpt: "Our quarterly report highlights a 32% increase in active users, 28% revenue growth, and the launch of 12 new features. See what we achieved together this quarter.",
    date: "May 28, 2026",
    readTime: "6 min read",
    author: "John Doe",
    tags: ["Company", "Report"],
  },
  {
    title: "Building Accessible Interfaces: Our Design Principles",
    excerpt: "Accessibility is not an afterthought — it is a core principle. Learn about our design system and the practices we follow to make our platform usable for everyone.",
    date: "May 20, 2026",
    readTime: "7 min read",
    author: "Emily Davis",
    tags: ["Design", "Engineering"],
  },
  {
    title: "Getting Started with the Personal API",
    excerpt: "A comprehensive guide to integrating with our REST and GraphQL APIs. Includes authentication, rate limits, code examples, and best practices for a smooth integration.",
    date: "May 12, 2026",
    readTime: "10 min read",
    author: "Alex Rivera",
    tags: ["API", "Guide"],
  },
];

export default function BlogPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Blog" description="Latest updates, guides, and stories from the team." />

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-300/50 to-indigo-200 hidden md:block" />

        <div className="space-y-8">
          {posts.map((post, i) => (
            <div key={i} className="relative md:pl-14 group">
              {/* Timeline dot: hover dot */}
              <div className="absolute left-[11px] top-7 w-[18px] h-[18px] rounded-full bg-white border-2 border-indigo-300 hidden md:hidden md:group-hover:block md:group-hover:border-indigo-500 group-hover:bg-indigo-50 transition-colors z-10" />
              {/* Timeline dot: default dot */}
              <div className="absolute left-[15px] top-[30px] w-[10px] h-[10px] rounded-full bg-indigo-500 hidden md:block md:group-hover:hidden" />

              {/* Card */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="p-6">
                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {post.author}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/10"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

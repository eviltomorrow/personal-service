import { PageHeader } from "@/components/page-header";
import { HelpCircle, BookOpen, MessageCircle, FileText, LifeBuoy, Mail } from "lucide-react";

const resources = [
  { label: "Documentation", description: "Comprehensive guides and API references", icon: BookOpen },
  { label: "FAQ", description: "Frequently asked questions", icon: HelpCircle },
  { label: "Community Forum", description: "Discuss with other users", icon: MessageCircle },
  { label: "API Reference", description: "Endpoint documentation and examples", icon: FileText },
  { label: "Support Center", description: "Get help from our team", icon: LifeBuoy },
  { label: "Contact Us", description: "Reach out via email", icon: Mail },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Help Center" description="Find answers and get support." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {resources.map((r) => (
          <button
            key={r.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="rounded-lg bg-indigo-50 p-2.5 w-fit group-hover:bg-indigo-100 transition-colors">
              <r.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">{r.label}</p>
            <p className="mt-1 text-xs text-gray-500">{r.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

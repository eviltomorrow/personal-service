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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Help Center</h1>
        <p className="mt-1 text-sm text-white/50">Find answers and get support.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {resources.map((r) => (
          <button
            key={r.label}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-all text-left group"
          >
            <div className="rounded-lg bg-white/10 p-2.5 w-fit group-hover:bg-white/15 transition-colors">
              <r.icon className="h-5 w-5 text-white/70" />
            </div>
            <p className="mt-4 text-sm font-medium text-white/80">{r.label}</p>
            <p className="mt-1 text-xs text-white/40">{r.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

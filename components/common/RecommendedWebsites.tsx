import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface WebsiteLink {
  title: string;
  url: string;
  content: string;
  dofollow: boolean;
}

const websiteLinks: WebsiteLink[] = [
  {
    title: "AI Song Generator & AI Music Generator",
    url: "https://musirio.com?utm_source=imagegpt",
    content: "Poyo AI",
    dofollow: true,
  },

  {
    title: "ChatImg",
    url: "https://www.chatimg.io/",
    content: "ChatImg",
    dofollow: true,
  },
  {
    title: "OpenCut",
    url: "https://opencut.ai/",
    content: "OpenCut",
    dofollow: true,
  }
];

const RecommendedWebsites: React.FC = () => {
  return (
    <div className="bg-card text-card-foreground h-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-6">
            {websiteLinks.map((link, index) => (
              <Button
                key={index}
                variant="link"
                asChild
                className="text-sm md:text-base text-muted-foreground hover:text-primary p-0 h-auto"
              >
                <a
                  href={link.url}
                  rel={link.dofollow ? undefined : "nofollow"}
                  target="_blank"
                  title={link.title}
                  className="flex items-center gap-1"
                >
                  {link.content}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendedWebsites;

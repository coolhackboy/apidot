'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
  XIcon,
} from 'react-share';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  direction?: 'horizontal' | 'vertical';
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description, direction = 'horizontal' }) => {
  const iconSize = 32;
  const iconBgStyle = "rounded-full hover:opacity-80 transition-opacity";
  const containerStyle = direction === 'horizontal' ? "flex gap-2" : "flex flex-col gap-2";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={containerStyle}>
      <FacebookShareButton url={url} title={title} className={iconBgStyle}>
        <FacebookIcon size={iconSize} round />
      </FacebookShareButton>

      <TwitterShareButton url={url} title={title} className={iconBgStyle}>
        <XIcon size={iconSize} round />
      </TwitterShareButton>

      <WhatsappShareButton url={url} title={title} className={iconBgStyle}>
        <WhatsappIcon size={iconSize} round />
      </WhatsappShareButton>

      <LinkedinShareButton url={url} title={title} summary={description} className={iconBgStyle}>
        <LinkedinIcon size={iconSize} round />
      </LinkedinShareButton>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-8 h-8"
        onClick={handleCopyLink}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SocialShare; 
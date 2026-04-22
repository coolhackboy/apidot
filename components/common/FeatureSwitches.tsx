"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { toast } from "sonner";

interface FeatureSwitchesProps {
  watermarkEnabled: boolean;
  displayPublic: boolean;
  onWatermarkChange: (enabled: boolean) => void;
  onDisplayPublicChange: (enabled: boolean) => void;
  onLoginRequired: () => void;
  onUpgradeRequired: () => void;
  isLoggedIn: boolean;
}

const FeatureSwitches: React.FC<FeatureSwitchesProps> = ({
  watermarkEnabled,
  displayPublic,
  onWatermarkChange,
  onDisplayPublicChange,
  onLoginRequired,
  onUpgradeRequired,
  isLoggedIn,
}) => {
  const handleSwitchToggle = async (type: 'watermark' | 'public') => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    try {
      const userInfo = await apiService.getUserInfo(appConfig.appName);
      if (userInfo.data.status === "free") {
        toast.error("This feature is only available for premium users");
        onUpgradeRequired();
        return;
      }

      // If user is premium, allow toggle
      if (type === 'watermark') {
        onWatermarkChange(!watermarkEnabled);
      } else {
        onDisplayPublicChange(!displayPublic);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      toast.error("Failed to check user status");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="watermark" className="flex flex-col space-y-0.5 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Watermark</span>
            <Image src="/icon/vip.svg" alt="VIP" width={16} height={16} />
          </div>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Free users cannot disable watermark
          </span>
        </Label>
        <div className="relative">
          <Switch
            id="watermark"
            checked={watermarkEnabled}
            onCheckedChange={() => handleSwitchToggle('watermark')}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:via-pink-500 data-[state=checked]:to-rose-500 transition-all duration-300"
          />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-medium">
            50% OFF
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="public" className="flex flex-col space-y-0.5 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Display Public</span>
            <Image src="/icon/vip.svg" alt="VIP" width={16} height={16} />
          </div>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Free usage will be public, upgrade to make it private
          </span>
        </Label>
        <div className="relative">
          <Switch
            id="public"
            checked={displayPublic}
            onCheckedChange={() => handleSwitchToggle('public')}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:via-pink-500 data-[state=checked]:to-rose-500 transition-all duration-300"
          />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-medium">
            50% OFF
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSwitches; 
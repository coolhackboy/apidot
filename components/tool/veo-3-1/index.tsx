"use client";

import React, { useEffect, useRef, useState } from "react";
import { veo3Api, Veo3StatusData } from "@/services/veo3Service";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, Download, Coins } from "lucide-react";
import { uploadToR2 } from "@/utils/r2";
import LoginForm from "@/components/auth/LoginForm";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import FloatingGenerateBar from "@/components/tool/FloatingGenerateBar";
import ViewportFollowPanel from "@/components/tool/ViewportFollowPanel";

interface Veo3Props {
  title?: string;
  description?: string;
  locale?: string;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
}

type ConfigMode = "form" | "json";
type ResultMode = "preview" | "json";
type ModelType = "veo3.1-fast" | "veo3.1-lite" | "veo3.1-quality";
type ResolutionType = "720p" | "1080p" | "4k";
type GenerationMode = "text" | "image";
type GenerateType = "frame" | "reference";

interface SelectedImage {
  file: File;
  url: string;
  uploadedUrl?: string;
  uploading?: boolean;
}

const revokeSelectedImageUrl = (image: SelectedImage | null | undefined) => {
  if (image?.url.startsWith("blob:")) {
    URL.revokeObjectURL(image.url);
  }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_OUTPUT_VIDEO_URL = "https://cdn.doculator.org/veo-3-1/example-output.mp4";
const DEFAULT_PROMPT = `A monkey and polar bear host a casual podcast about AI inference, bringing their unique perspectives from different environments (tropical vs. arctic) to discuss how AI systems make decisions and process information.
Sample Dialogue:
Monkey (Banana): "Welcome back to Bananas & Ice! I am Banana"
Polar Bear (Ice): "And I'm Ice!"`;

const MODEL_OPTIONS: ModelType[] = ["veo3.1-lite", "veo3.1-fast", "veo3.1-quality"];
const GENERATE_TYPE_OPTIONS: GenerateType[] = ["frame", "reference"];

const CREDITS_PER_VIDEO: Record<ModelType, Record<ResolutionType, number>> = {
  "veo3.1-fast": {
    "720p": 20,
    "1080p": 20,
    "4k": 60,
  },
  "veo3.1-lite": {
    "720p": 10,
    "1080p": 10,
    "4k": 30,
  },
  "veo3.1-quality": {
    "720p": 120,
    "1080p": 120,
    "4k": 400,
  },
};

const isModelType = (value: unknown): value is ModelType =>
  typeof value === "string" && MODEL_OPTIONS.includes(value as ModelType);

const isResolutionType = (value: unknown): value is ResolutionType =>
  value === "720p" || value === "1080p" || value === "4k";

const isAspectRatioType = (value: unknown): value is "16:9" | "9:16" =>
  value === "16:9" || value === "9:16";

const isGenerateType = (value: unknown): value is GenerateType =>
  typeof value === "string" && GENERATE_TYPE_OPTIONS.includes(value as GenerateType);

const supportsImageMode = (model: ModelType) => model !== "veo3.1-lite";

const supportsReferenceMode = (model: ModelType) => model === "veo3.1-fast";

const getCreditsForSelection = (model: ModelType, resolution: ResolutionType) =>
  CREDITS_PER_VIDEO[model][resolution];

const getPreviewSelection = (
  configMode: ConfigMode,
  jsonConfig: string,
  fallbackModel: ModelType,
  fallbackResolution: ResolutionType,
) => {
  if (configMode !== "json") {
    return { model: fallbackModel, resolution: fallbackResolution };
  }

  try {
    const parsed = JSON.parse(jsonConfig);
    const input = parsed?.input ?? parsed;
    const nextModel = isModelType(parsed?.model) ? parsed.model : fallbackModel;
    const nextResolution = isResolutionType(input?.resolution)
      ? input.resolution
      : fallbackResolution;
    return { model: nextModel, resolution: nextResolution };
  } catch {
    return { model: fallbackModel, resolution: fallbackResolution };
  }
};

const getImageInputError = (
  model: ModelType,
  imageUrls: unknown,
  generateType?: unknown,
): string | null => {
  const urls = imageUrls === undefined ? [] : imageUrls;

  if (urls !== undefined && !Array.isArray(urls)) {
    return "image_urls must be an array";
  }

  const imageCount = Array.isArray(urls) ? urls.length : 0;
  const hasGenerateType = generateType !== undefined && generateType !== null && generateType !== "";

  if (hasGenerateType && !isGenerateType(generateType)) {
    return "generate_type must be frame or reference";
  }

  if (model === "veo3.1-lite") {
    if (hasGenerateType || imageCount > 0) {
      return "veo3.1-lite only supports text-to-video; remove generate_type and image_urls";
    }
    return null;
  }

  if (model === "veo3.1-quality" && generateType === "reference") {
    return "veo3.1-quality does not support reference mode";
  }

  if (imageCount === 0) {
    if (hasGenerateType) {
      return "generate_type requires image_urls";
    }
    return null;
  }

  if (imageCount > 3) {
    return "image_urls supports up to 3 images";
  }

  const resolvedType = isGenerateType(generateType)
    ? generateType
    : imageCount === 3
      ? "reference"
      : "frame";

  if (model === "veo3.1-quality" && resolvedType === "reference") {
    return "veo3.1-quality does not support reference mode";
  }

  if (resolvedType === "frame" && imageCount > 2) {
    return "frame mode supports up to 2 images";
  }

  return null;
};

const Veo3 = ({
  selectedModel = "veo3.1-lite",
  onModelChange,
}: Veo3Props) => {
  const t = useTranslations('modelDetail.model');

  // Authentication states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // UI Mode states
  const [configMode, setConfigMode] = useState<ConfigMode>("form");
  const [resultMode, setResultMode] = useState<ResultMode>("preview");

  // Configuration form states
  const [model, setModel] = useState<ModelType>(selectedModel);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [duration] = useState<8>(8); // Fixed at 8 seconds for VEO3
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | undefined>("16:9");
  const [resolution, setResolution] = useState<ResolutionType>("720p");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("text");
  const [generateType, setGenerateType] = useState<GenerateType>("frame");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  const imageModeEnabled = generationMode === "image" && supportsImageMode(model);
  const referenceModeEnabled = imageModeEnabled && supportsReferenceMode(model) && generateType === "reference";
  const effectiveGenerateType: GenerateType = referenceModeEnabled ? "reference" : "frame";
  const maxImages = imageModeEnabled ? (effectiveGenerateType === "frame" ? 2 : 3) : 0;

  // JSON editor state
  const [jsonConfig, setJsonConfig] = useState("");

  // Generation states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Processing states
  const [taskId, setTaskId] = useState<string>();
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [displayVideo, setDisplayVideo] = useState<Veo3StatusData | null>({
    task_id: "61LYTOGGUXR8NJ9C",
    status: "finished",
    files: [
      {
        "file_url": DEFAULT_OUTPUT_VIDEO_URL,
        "file_type": "video"
      }
    ],
    created_time: "2025-11-21T01:35:33",
    error_message: null
  });
  const [apiResponse, setApiResponse] = useState<any>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const selectedImagesRef = useRef<SelectedImage[]>(selectedImages);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const previewSelection = getPreviewSelection(configMode, jsonConfig, model, resolution);
  const requiredCredits = getCreditsForSelection(
    previewSelection.model,
    previewSelection.resolution,
  );

  const handleModelChange = (nextModel: ModelType) => {
    setModel(nextModel);
    onModelChange?.(nextModel);

    if (!supportsImageMode(nextModel)) {
      selectedImages.forEach(revokeSelectedImageUrl);
      setSelectedImages([]);
      setGenerationMode("text");
      setGenerateType("frame");
      return;
    }

    if (!supportsReferenceMode(nextModel) && generateType === "reference") {
      selectedImages.slice(2).forEach(revokeSelectedImageUrl);
      setSelectedImages((prev) => prev.slice(0, 2));
      setGenerateType("frame");
    }
  };

  // Check if user is logged in
  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  useEffect(() => {
    if (selectedModel !== model) {
      handleModelChange(selectedModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // Sync form state to JSON when switching modes or when form values change
  useEffect(() => {
    if (configMode === "json") {
      const uploadedUrls = selectedImages
        .filter(img => img.uploadedUrl)
        .map(img => img.uploadedUrl!);
      const shouldIncludeImages = imageModeEnabled && uploadedUrls.length > 0;

      const config: any = {
        model,
        input: {
          prompt,
          duration,
          ...(aspectRatio && { aspect_ratio: aspectRatio }),
          ...(resolution && { resolution }),
          ...(shouldIncludeImages && { generate_type: effectiveGenerateType }),
          ...(shouldIncludeImages && { image_urls: uploadedUrls }),
        }
      };
      setJsonConfig(JSON.stringify(config, null, 2));
    }
  }, [
    configMode,
    model,
    prompt,
    duration,
    aspectRatio,
    resolution,
    imageModeEnabled,
    effectiveGenerateType,
    selectedImages,
  ]);

  const handleError = (error: any, defaultMessage: string) => {
    console.error(error);
    toast.error(error.message || defaultMessage);
    setIsProcessingVideo(false);
    setIsSubmitting(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!imageModeEnabled) {
        toast.error("Image inputs are not available for this model or mode");
        return;
      }

      // Check if max images reached
      if (selectedImages.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed for ${effectiveGenerateType} mode`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 10MB limit");
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Please upload JPEG, PNG, or WebP images only");
      }

      // Create preview URL and add to array
      const url = URL.createObjectURL(file);
      const newImage: SelectedImage = { file, url, uploading: true };
      setSelectedImages(prev => [...prev, newImage]);

      // Upload immediately
      try {
        const fileName = `veo-3-1-image-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const result = await uploadToR2(file, fileName);

        setSelectedImages(prev =>
          prev.map(img =>
            img.url === url ? { ...img, uploadedUrl: result.url, uploading: false } : img
          )
        );
        toast.success("Image uploaded successfully");
      } catch (uploadError: any) {
        console.error("Failed to upload image:", uploadError);
        setSelectedImages(prev => prev.filter(img => img.url !== url));
        URL.revokeObjectURL(url);
        toast.error("Failed to upload image");
      }

      // Reset input value to allow re-selecting same file
      event.target.value = '';
    } catch (error: any) {
      handleError(error, "Failed to select image");
    }
  };

  const handleImageUploadAtIndex = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!imageModeEnabled) {
        toast.error("Image inputs are not available for this model or mode");
        return;
      }

      if (targetIndex >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed for ${effectiveGenerateType} mode`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 10MB limit");
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Please upload JPEG, PNG, or WebP images only");
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      const newImage: SelectedImage = { file, url, uploading: true };

      // Insert at specific index
      setSelectedImages(prev => {
        const newArr = [...prev];
        // Fill gaps with undefined if needed, then set at index
        while (newArr.length < targetIndex) {
          newArr.push(undefined as any);
        }
        newArr[targetIndex] = newImage;
        return newArr.filter(Boolean); // Remove any undefined gaps
      });

      // Upload immediately
      try {
        const fileName = `veo-3-1-image-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const result = await uploadToR2(file, fileName);

        setSelectedImages(prev =>
          prev.map(img =>
            img?.url === url ? { ...img, uploadedUrl: result.url, uploading: false } : img
          )
        );
        toast.success("Image uploaded successfully");
      } catch (uploadError: any) {
        console.error("Failed to upload image:", uploadError);
        setSelectedImages(prev => prev.filter(img => img?.url !== url));
        URL.revokeObjectURL(url);
        toast.error("Failed to upload image");
      }

      event.target.value = '';
    } catch (error: any) {
      handleError(error, "Failed to select image");
    }
  };

  const handleRemoveImage = (index: number) => {
    const image = selectedImages[index];
    revokeSelectedImageUrl(image);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllImages = () => {
    selectedImages.forEach(revokeSelectedImageUrl);
    setSelectedImages([]);
  };

  const handleReset = () => {
    selectedImages.forEach(revokeSelectedImageUrl);
    setConfigMode("form");
    handleModelChange(selectedModel);
    setPrompt(DEFAULT_PROMPT);
    setAspectRatio("16:9");
    setResolution("720p");
    setGenerationMode("text");
    setGenerateType("frame");
    setSelectedImages([]);
    setJsonConfig("");
  };

  const handleGenerateVideo = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // Check if any images are still uploading
    if (selectedImages.some(img => img.uploading)) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    // Parse configuration based on mode
    let config: any;
    if (configMode === "json") {
      try {
        const parsedConfig = JSON.parse(jsonConfig);
        // Handle nested input structure
        if (parsedConfig.input) {
          config = {
            model: parsedConfig.model,
            callback_url: parsedConfig.callback_url,
            prompt: parsedConfig.input.prompt,
            duration: parsedConfig.input.duration,
            aspect_ratio: parsedConfig.input.aspect_ratio,
            resolution: parsedConfig.input.resolution,
            generate_type: parsedConfig.input.generate_type,
            image_urls: parsedConfig.input.image_urls,
          };
        } else {
          // Fallback for flat structure
          config = parsedConfig;
        }

        if (!config.prompt?.trim()) {
          toast.error("Please enter a prompt in JSON config");
          return;
        }
        if (!isModelType(config.model)) {
          toast.error("Please use veo3.1-fast, veo3.1-lite, or veo3.1-quality in JSON config");
          return;
        }
        if (config.resolution && !isResolutionType(config.resolution)) {
          toast.error("Resolution must be 720p, 1080p, or 4k");
          return;
        }
        if (config.duration !== undefined && config.duration !== 8) {
          toast.error("Veo 3.1 duration is fixed at 8 seconds");
          return;
        }
        if (config.aspect_ratio && !isAspectRatioType(config.aspect_ratio)) {
          toast.error("Aspect ratio must be 16:9 or 9:16");
          return;
        }
        const imageInputError = getImageInputError(
          config.model,
          config.image_urls,
          config.generate_type,
        );
        if (imageInputError) {
          toast.error(imageInputError);
          return;
        }
      } catch (error) {
        toast.error("Invalid JSON configuration");
        return;
      }
    } else {
      if (!prompt.trim()) {
        toast.error("Please enter a prompt");
        return;
      }

      // Get uploaded image URLs
      const imageUrls = selectedImages
        .filter(img => img.uploadedUrl)
        .map(img => img.uploadedUrl!);
      const imageInputError = getImageInputError(
        model,
        imageModeEnabled ? imageUrls : undefined,
        imageModeEnabled && imageUrls.length > 0 ? effectiveGenerateType : undefined,
      );

      if (imageModeEnabled && imageUrls.length < 1) {
        toast.error("Image to Video requires at least one image");
        return;
      }

      if (imageInputError) {
        toast.error(imageInputError);
        return;
      }

      config = {
        model,
        prompt: prompt.trim(),
        duration,
        ...(aspectRatio && { aspect_ratio: aspectRatio }),
        ...(resolution && { resolution }),
        ...(imageModeEnabled && imageUrls.length > 0 && { generate_type: effectiveGenerateType }),
        ...(imageModeEnabled && imageUrls.length > 0 && { image_urls: imageUrls }),
      };
    }

    if (!isModelType(config.model)) {
      toast.error("Invalid model selection");
      return;
    }

    const submitResolution: ResolutionType = isResolutionType(config.resolution)
      ? config.resolution
      : "720p";
    const submitCredits = getCreditsForSelection(config.model, submitResolution);

    if (config.model !== model) {
      handleModelChange(config.model);
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setTaskId("");
      setDisplayVideo(null);
      setApiResponse(null);
      setIsProcessingVideo(true);

      // Check user credits
      try {
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data.credits_amount < submitCredits) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          setIsProcessingVideo(false);
          return;
        }
      } catch (creditError) {
        console.error("Failed to check credits:", creditError);
      }

      // Submit generation request
      const response = await veo3Api.submit({
        model: config.model,
        callback_url: config.callback_url,
        prompt: config.prompt,
        image_urls: config.image_urls,
        duration: config.duration ?? 8,
        aspect_ratio: config.aspect_ratio,
        resolution: config.resolution,
        generate_type: config.generate_type,
      });

      setApiResponse(response);

      if (!response.data?.task_id) {
        throw new Error("Failed to generate video");
      }

      const generatedTaskId = response.data.task_id;
      setTaskId(generatedTaskId);
      toast.success("Video generation started!");

      // Start polling for status
      startPollingStatus(generatedTaskId);
    } catch (error: any) {
      handleError(error, "Failed to generate video. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const startPollingStatus = async (task_id: string) => {
    const pollStatus = async () => {
      try {
        const result = await veo3Api.checkGenerateStatus(task_id);

        if (result.data) {
          setDisplayVideo(result.data);

          if (
            result.data.status === "finished" ||
            result.data.status === "failed"
          ) {
            stopPolling();
            setIsProcessingVideo(false);

            if (result.data.status === "finished") {
              toast.success("Video generated successfully!");
            } else {
              toast.error(
                result.data.error_message || "Video generation failed"
              );
            }
          } else if (result.data.status === "not_started" || result.data.status === "running") {
            // Continue polling for not_started and running statuses
            setIsProcessingVideo(true);
          }
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    };

    // Poll immediately
    await pollStatus();

    // Set up interval for subsequent polls (20 seconds for video generation)
    intervalIdRef.current = setInterval(pollStatus, 20000);
  };

  const stopPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      selectedImagesRef.current.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  // Render configuration panel based on mode
  const renderConfigPanel = () => {
    if (configMode === "json") {
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium">JSON Configuration</Label>
          <Textarea
            value={jsonConfig}
            onChange={(e) => setJsonConfig(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            disabled={isSubmitting}
            placeholder='{\n  "model": "veo3.1-lite",\n  "input": {\n    "prompt": "Your video description (max 1000 chars)",\n    "duration": 8,\n    "aspect_ratio": "16:9",\n    "resolution": "720p"\n  }\n}'
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('model')}
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={model === "veo3.1-lite" ? "default" : "outline"}
              onClick={() => handleModelChange("veo3.1-lite")}
              disabled={isSubmitting}
              className={
                model === "veo3.1-lite"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              veo3.1-lite
            </Button>
            <Button
              type="button"
              variant={model === "veo3.1-fast" ? "default" : "outline"}
              onClick={() => handleModelChange("veo3.1-fast")}
              disabled={isSubmitting}
              className={
                model === "veo3.1-fast"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              veo3.1-fast
            </Button>
            <Button
              type="button"
              variant={model === "veo3.1-quality" ? "default" : "outline"}
              onClick={() => handleModelChange("veo3.1-quality")}
              disabled={isSubmitting}
              className={
                model === "veo3.1-quality"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              veo3.1-quality
            </Button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('prompt')} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="A cinematic shot of a drone flying through a futuristic city..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] resize-y"
            disabled={isSubmitting}
          />
        </div>

        {/* Duration Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('duration')} <span className="text-red-500">*</span>
          </Label>
          <Input
            value="8 seconds"
            readOnly
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('aspectRatio')} <span className="text-red-500">*</span>
          </Label>
          <Select value={aspectRatio || "none"} onValueChange={(val) => setAspectRatio(val === "none" ? undefined : val as "16:9" | "9:16")}>
            <SelectTrigger>
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resolution Selection (4K support) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Resolution <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={resolution === "720p" ? "default" : "outline"}
              onClick={() => setResolution("720p")}
              disabled={isSubmitting}
              className={
                resolution === "720p"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              720p
            </Button>
            <Button
              type="button"
              variant={resolution === "1080p" ? "default" : "outline"}
              onClick={() => setResolution("1080p")}
              disabled={isSubmitting}
              className={
                resolution === "1080p"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              1080p
            </Button>
            <Button
              type="button"
              variant={resolution === "4k" ? "default" : "outline"}
              onClick={() => setResolution("4k")}
              disabled={isSubmitting}
              className={
                resolution === "4k"
                  ? "flex-1"
                  : "flex-1 hover:bg-muted hover:text-foreground"
              }
            >
              4K
            </Button>
          </div>
        </div>

        {/* Generation Mode Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Generation Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={generationMode === "text" ? "default" : "outline"}
              className={generationMode === "text" ? undefined : "hover:bg-muted hover:text-foreground"}
              onClick={() => {
                handleRemoveAllImages();
                setGenerationMode("text");
              }}
              disabled={isSubmitting}
            >
              Text to Video
            </Button>
            <Button
              type="button"
              variant={generationMode === "image" ? "default" : "outline"}
              className={generationMode === "image" ? undefined : "hover:bg-muted hover:text-foreground"}
              onClick={() => setGenerationMode("image")}
              disabled={isSubmitting || !supportsImageMode(model)}
            >
              Image to Video
            </Button>
          </div>
          {!supportsImageMode(model) ? (
            <p className="text-xs text-muted-foreground">
              veo3.1-lite supports text-to-video only.
            </p>
          ) : null}
        </div>

        {imageModeEnabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image Mode</Label>
            <Select
              value={effectiveGenerateType}
              onValueChange={(val) => {
                const newType = val as GenerateType;
                setGenerateType(newType);
                if (newType === "frame" && selectedImages.length > 2) {
                  selectedImages.slice(2).forEach(revokeSelectedImageUrl);
                  setSelectedImages((prev) => prev.slice(0, 2));
                  toast.info("Extra images removed for frame mode (max 2)");
                }
              }}
            >
              <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select image mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frame">Frame (first/last frames, max 2 images)</SelectItem>
                {supportsReferenceMode(model) && (
                  <SelectItem value="reference">Reference (max 3 images)</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {effectiveGenerateType === "frame"
                ? "First image is required, second image is optional."
                : "Use up to 3 reference images for style and subject guidance."}
            </p>
          </div>
        )}

        {/* Image Upload - Different layouts based on generation type */}
        {imageModeEnabled && effectiveGenerateType === "frame" && (
          /* Frame Mode: First Frame and Last Frame vertically stacked */
          <div className="space-y-4">
            {/* First Frame Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">First Frame URL <span className="text-red-500">*</span></Label>
              <div className="relative w-full rounded-lg border border-border bg-background p-3">
                {selectedImages[0] ? (
                  <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden">
                    <img
                      src={selectedImages[0].url}
                      alt="First Frame"
                      className={`w-full h-full object-contain ${selectedImages[0].uploading ? 'opacity-50' : ''}`}
                    />
                    {selectedImages[0].uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(0)}
                      disabled={selectedImages[0].uploading}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                      aria-label="Remove first frame"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUploadAtIndex(e, 0)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isUploading || isSubmitting}
                    />
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload first frame</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP (max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Last Frame Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Frame URL</Label>
              <div className="relative w-full rounded-lg border border-border bg-background p-3">
                {selectedImages[1] ? (
                  <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden">
                    <img
                      src={selectedImages[1].url}
                      alt="Last Frame"
                      className={`w-full h-full object-contain ${selectedImages[1].uploading ? 'opacity-50' : ''}`}
                    />
                    {selectedImages[1].uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(1)}
                      disabled={selectedImages[1].uploading}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                      aria-label="Remove last frame"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUploadAtIndex(e, 1)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isUploading || isSubmitting}
                    />
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload last frame</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP (max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {imageModeEnabled && effectiveGenerateType === "reference" && (
          /* Reference Mode: 3 images side by side */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Reference Images (Optional)</Label>
              {selectedImages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAllImages}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to 3 reference images - JPEG, PNG, or WebP (max 10MB each)</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative aspect-square rounded-lg border border-border bg-background overflow-hidden">
                  {selectedImages[index] ? (
                    <>
                      <img
                        src={selectedImages[index].url}
                        alt={`Reference ${index + 1}`}
                        className={`w-full h-full object-cover ${selectedImages[index].uploading ? 'opacity-50' : ''}`}
                      />
                      {selectedImages[index].uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        disabled={selectedImages[index].uploading}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                        aria-label={`Remove reference ${index + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                        {index + 1}
                      </div>
                    </>
                  ) : (
                    <div className="relative w-full h-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUploadAtIndex(e, index)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading || isSubmitting || selectedImages.some(img => img.uploading)}
                      />
                      <div className="flex flex-col items-center justify-center h-full text-center p-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-1">{index + 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  // Render results panel based on mode
  const renderResultsPanel = () => {
    if (resultMode === "json") {
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Response Data</Label>
          <Textarea
            value={JSON.stringify(displayVideo || {}, null, 2)}
            readOnly
            className="min-h-[500px] font-mono text-sm bg-muted"
          />
        </div>
      );
    }

    // Preview mode - display complete status data
    if (!displayVideo) {
      return (
        <div className="w-full aspect-video bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">No data yet</p>
            <p className="text-xs text-muted-foreground">Response data will appear here</p>
          </div>
        </div>
      );
    }

    // Display status information
    return (
      <div className="space-y-4">
        {/* Status Card */}
        <div className="bg-background/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Task ID:</span>
              <p className="font-mono text-xs mt-1 break-all">{displayVideo.task_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className={`mt-1 font-medium ${displayVideo.status === 'finished' ? 'text-green-500' :
                displayVideo.status === 'failed' ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                {displayVideo.status}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="text-xs mt-1">{displayVideo.created_time}</p>
            </div>
            {displayVideo.progress !== undefined && (
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <p className="mt-1">{displayVideo.progress}%</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {displayVideo.error_message && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500 font-medium mb-1">Error:</p>
              <p className="text-xs text-red-400">{displayVideo.error_message}</p>
            </div>
          )}

          {/* Processing State */}
          {(displayVideo.status === 'not_started' || displayVideo.status === 'running') && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-sm text-blue-500">Generating video...</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Files */}
        {displayVideo.files && displayVideo.files.length > 0 && (
          <div className="space-y-4">
            {displayVideo.files.filter(file => file.file_type === "video").map((file, index) => (
              <div key={index} className="space-y-2">
                {displayVideo.files!.filter(f => f.file_type === "video").length > 1 && (
                  <h4 className="text-sm font-medium">Video {index + 1}</h4>
                )}
                <div className="relative w-full bg-black rounded-lg overflow-hidden">
                  <video
                    src={file.file_url}
                    controls
                    preload="metadata"
                    className="w-full h-auto rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Video generated successfully
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingIndex === index}
                    onClick={async () => {
                      try {
                        setDownloadingIndex(index);
                        const downloadUrl = `/api/download?url=${encodeURIComponent(file.file_url)}`;
                        const response = await fetch(downloadUrl);
                        if (!response.ok) throw new Error('Download failed');

                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `video_${displayVideo.task_id}_${index}.mp4`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        URL.revokeObjectURL(blobUrl);
                        toast.success("Video downloaded successfully!");
                      } catch (error) {
                        console.error("Download failed:", error);
                        toast.error("Failed to download video");
                      } finally {
                        setDownloadingIndex(null);
                      }
                    }}
                  >
                    {downloadingIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Login Modal */}
      <LoginForm
        app_name={appConfig.appName}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <Coins className="h-12 w-12 mx-auto text-orange-500" />
              <h3 className="text-lg font-semibold">Insufficient Credits</h3>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white"
                onClick={() => {
                  window.open("/dashboard/billing", "_blank");
                }}
              >
                Recharge Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:gap-8 lg:grid-cols-2 items-stretch">
            {/* Left side - Configuration */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6 h-full">
              <Card className="bg-muted/50 border rounded-3xl shadow-none h-full">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div data-tool-action-boundary className="relative flex min-h-0 flex-1 flex-col gap-4">
                    {/* Header with toggle */}
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="text-lg font-semibold">Input</div>
                      <div className="flex gap-1 bg-muted rounded-lg p-1">
                        <Button
                          size="sm"
                          variant={configMode === "form" ? "default" : "ghost"}
                          onClick={() => setConfigMode("form")}
                          className={configMode === "form" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          Form
                        </Button>
                        <Button
                          size="sm"
                          variant={configMode === "json" ? "default" : "ghost"}
                          onClick={() => setConfigMode("json")}
                          className={configMode === "json" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          JSON
                        </Button>
                      </div>
                    </div>

                    {/* Configuration content */}
                    {renderConfigPanel()}

                    <FloatingGenerateBar
                      className="mt-auto"
                      secondaryLabel="Reset"
                      actionLabel="Generate Video"
                      loadingLabel={
                        selectedImages.some((img) => img.uploading)
                          ? "Uploading images..."
                          : isUploading
                            ? "Uploading..."
                            : "Generating..."
                      }
                      onSecondaryClick={handleReset}
                      onClick={handleGenerateVideo}
                      secondaryDisabled={
                        isSubmitting ||
                        isUploading ||
                        selectedImages.some((img) => img.uploading)
                      }
                      disabled={
                        isSubmitting ||
                        isUploading ||
                        (configMode === "form" && !prompt.trim()) ||
                        selectedImages.some((img) => img.uploading) ||
                        (configMode === "form" &&
                          imageModeEnabled &&
                          selectedImages.filter((img) => img.uploadedUrl).length < 1)
                      }
                      isLoading={isSubmitting || isUploading || selectedImages.some((img) => img.uploading)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Results */}
            <div className="space-y-3 sm:space-y-4 h-full">
              <Card className="bg-muted/50 border rounded-3xl shadow-none h-full">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    {/* Header with toggle */}
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="text-lg font-semibold">Output</div>
                      <div className="flex gap-1 bg-muted rounded-lg p-1">
                        <Button
                          size="sm"
                          variant={resultMode === "preview" ? "default" : "ghost"}
                          onClick={() => setResultMode("preview")}
                          className={resultMode === "preview" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant={resultMode === "json" ? "default" : "ghost"}
                          onClick={() => setResultMode("json")}
                          className={resultMode === "json" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          JSON
                        </Button>
                      </div>
                    </div>

                    {/* Results content */}
                    {resultMode === "preview" ? (
                      <ViewportFollowPanel className="flex-1">
                        {renderResultsPanel()}
                      </ViewportFollowPanel>
                    ) : (
                      renderResultsPanel()
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Veo3;

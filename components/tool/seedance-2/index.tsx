"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  seedance2Service,
  Seedance2ModelId,
  Seedance2Resolution,
  Seedance2AspectRatio,
  Seedance2StatusData,
  Seedance2SubmitRequest,
} from "@/services/seedance2Service";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, Download, Coins } from "lucide-react";
import { uploadToR2 } from "@/utils/r2";
import LoginForm from "@/components/auth/LoginForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import FloatingGenerateBar from "@/components/tool/FloatingGenerateBar";
import ViewportFollowPanel from "@/components/tool/ViewportFollowPanel";

interface Seedance2Props {
  title?: string;
  description?: string;
  locale?: string;
  selectedModel?: Seedance2ModelId;
}

type ConfigMode = "form" | "json";
type ResultMode = "preview" | "json";

type UploadedFile = {
  file?: File;
  url: string;
  uploadedUrl?: string;
  uploading?: boolean;
};

const revokeUploadedFileUrl = (file: UploadedFile | null) => {
  if (file?.url.startsWith("blob:")) {
    URL.revokeObjectURL(file.url);
  }
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];

const MIN_DURATION = 4;
const MAX_DURATION = 15;

type PriceTier = {
  withVideo: { credits: number; usd: number };
  noVideo: { credits: number; usd: number };
};

const RESOLUTIONS_BY_MODEL: Record<Seedance2ModelId, Seedance2Resolution[]> = {
  "seedance-2": ["480p", "720p", "1080p"],
  "seedance-2-fast": ["480p", "720p"],
};

// Price per second: credits and USD equivalent
const PRICE_PER_SECOND: Record<
  Seedance2ModelId,
  Partial<Record<Seedance2Resolution, PriceTier>>
> = {
  "seedance-2": {
    "480p": {
      withVideo: { credits: 10, usd: 0.05 },
      noVideo: { credits: 20, usd: 0.10 },
    },
    "720p": {
      withVideo: { credits: 20, usd: 0.10 },
      noVideo: { credits: 40, usd: 0.20 },
    },
    "1080p": {
      withVideo: { credits: 45, usd: 0.225 },
      noVideo: { credits: 90, usd: 0.45 },
    },
  },
  "seedance-2-fast": {
    "480p": {
      withVideo: { credits: 8, usd: 0.04 },
      noVideo: { credits: 14, usd: 0.07 },
    },
    "720p": {
      withVideo: { credits: 16, usd: 0.08 },
      noVideo: { credits: 28, usd: 0.14 },
    },
  },
};

const DEFAULT_PROMPT =
  "A women's volleyball match segment. Background music: energetic rhythmic track throughout. Setting: spacious indoor gymnasium with arched wooden ceiling and large side windows. The stands are packed with spectators cheering and screaming loudly. Colorful banners hang on the back wall. The blue team and green team exchange intense rallies. Players shout to communicate with teammates (audio slightly muffled). The green team fails to save the ball. A prolonged whistle is heard off-screen. Cut to close-up: a middle-aged female coach on the sidelines with short blonde hair, metal-framed glasses, and a green sports jacket. She watches intently, then lowers her head in frustration.";

const EXAMPLE_OUTPUT: Seedance2StatusData = {
  task_id: "PERRRQ2XC34JRFII",
  status: "finished",
  files: [
    {
      file_url: "https://storage.apidot.ai/models/seedance-2/TJ61OM2GRJ9BWYWH.mp4",
      file_type: "video",
    },
  ],
  created_time: "2026-04-10T16:38:00",
  progress: 100,
  error_message: null,
};

const getSupportedResolutions = (model: Seedance2ModelId) => RESOLUTIONS_BY_MODEL[model];
const getPriceTier = (
  model: Seedance2ModelId,
  resolution: Seedance2Resolution,
  hasVideoInput: boolean,
) => {
  const bucket = PRICE_PER_SECOND[model][resolution];
  if (!bucket) {
    throw new Error(`Unsupported resolution ${resolution} for model ${model}`);
  }
  return hasVideoInput ? bucket.withVideo : bucket.noVideo;
};

const Seedance2 = ({ selectedModel = "seedance-2" }: Seedance2Props) => {
  const t = useTranslations("modelDetail.model");

  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // UI mode
  const [configMode, setConfigMode] = useState<ConfigMode>("form");
  const [resultMode, setResultMode] = useState<ResultMode>("preview");

  // Core form
  const [model, setModel] = useState<Seedance2ModelId>(selectedModel);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [resolution, setResolution] = useState<Seedance2Resolution>("720p");
  const [duration, setDuration] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<Seedance2AspectRatio>("16:9");
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [seedInput, setSeedInput] = useState<string>("");

  // First + Last frame uploads
  const [firstFrameImage, setFirstFrameImage] = useState<UploadedFile | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<UploadedFile | null>(null);

  // Reference uploads
  const [referenceImage, setReferenceImage] = useState<UploadedFile | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<UploadedFile | null>(null);
  const [referenceAudio, setReferenceAudio] = useState<UploadedFile | null>(null);

  // JSON editor
  const [jsonConfig, setJsonConfig] = useState("");

  // Submit / polling state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string>();
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [displayVideo, setDisplayVideo] = useState<Seedance2StatusData | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  // Sync external selectedModel prop with internal state
  useEffect(() => {
    setModel(selectedModel);
  }, [selectedModel]);

  // Mutual exclusivity: image_urls vs reference_*_urls cannot be used together.
  const hasFrameImages = !!(firstFrameImage?.uploadedUrl || lastFrameImage?.uploadedUrl);
  const hasReferences = !!(
    referenceImage?.uploadedUrl ||
    referenceVideo?.uploadedUrl ||
    referenceAudio?.uploadedUrl
  );

  // Pricing helpers — "with video input" rate applies when a reference video is provided.
  const hasVideoInput = !!referenceVideo?.uploadedUrl;
  const supportedResolutions = getSupportedResolutions(model);
  const effectiveResolution = supportedResolutions.includes(resolution)
    ? resolution
    : supportedResolutions[supportedResolutions.length - 1];
  const priceTier = getPriceTier(model, effectiveResolution, hasVideoInput);
  const totalCredits = priceTier.credits * duration;

  // Login check
  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  useEffect(() => {
    if (resolution !== effectiveResolution) {
      setResolution(effectiveResolution);
    }
  }, [effectiveResolution, resolution]);

  // Keep JSON editor in sync with form state when json mode is active
  useEffect(() => {
    if (configMode !== "json") return;
    const input: any = {
      prompt,
      resolution: effectiveResolution,
      duration,
      aspect_ratio: aspectRatio,
      generate_audio: generateAudio,
    };
    if (seedInput.trim() && !Number.isNaN(Number(seedInput))) {
      input.seed = Number(seedInput);
    }
    if (hasFrameImages) {
      const images: string[] = [];
      if (firstFrameImage?.uploadedUrl) images.push(firstFrameImage.uploadedUrl);
      if (lastFrameImage?.uploadedUrl) images.push(lastFrameImage.uploadedUrl);
      if (images.length) input.image_urls = images;
    } else if (hasReferences) {
      if (referenceImage?.uploadedUrl) input.reference_image_urls = [referenceImage.uploadedUrl];
      if (referenceVideo?.uploadedUrl) input.reference_video_urls = [referenceVideo.uploadedUrl];
      if (referenceAudio?.uploadedUrl) input.reference_audio_urls = [referenceAudio.uploadedUrl];
    }
    setJsonConfig(JSON.stringify({ model, input }, null, 2));
  }, [
    configMode,
    model,
    prompt,
    effectiveResolution,
    duration,
    aspectRatio,
    generateAudio,
    seedInput,
    hasFrameImages,
    hasReferences,
    firstFrameImage,
    lastFrameImage,
    referenceImage,
    referenceVideo,
    referenceAudio,
  ]);

  const handleError = (error: any, defaultMessage: string) => {
    console.error(error);
    toast.error(error?.message || defaultMessage);
    setIsProcessingVideo(false);
    setIsSubmitting(false);
  };

  // Generic upload helper
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "image" | "video" | "audio",
    setter: (f: UploadedFile | null) => void,
    filePrefix: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (kind === "image") {
        if (file.size > MAX_IMAGE_SIZE) throw new Error("Image exceeds 10MB limit");
        if (!ALLOWED_IMAGE_TYPES.includes(file.type))
          throw new Error("Please upload JPEG, PNG, or WebP images only");
      } else if (kind === "video") {
        if (file.size > MAX_VIDEO_SIZE) throw new Error("Video exceeds 50MB limit");
        if (!ALLOWED_VIDEO_TYPES.includes(file.type))
          throw new Error("Please upload MP4, WebM, or MOV videos only");
      } else {
        if (file.size > MAX_AUDIO_SIZE) throw new Error("Audio exceeds 20MB limit");
        if (!ALLOWED_AUDIO_TYPES.includes(file.type))
          throw new Error("Please upload MP3, WAV, OGG, or M4A audio only");
      }

      const url = URL.createObjectURL(file);
      setter({ file, url, uploading: true });

      try {
        const fileName = `${filePrefix}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}-${file.name}`;
        const result = await uploadToR2(file, fileName);
        setter({ file, url, uploadedUrl: result.url, uploading: false });
        toast.success("File uploaded successfully");
      } catch (uploadError: any) {
        console.error("Failed to upload file:", uploadError);
        setter(null);
        URL.revokeObjectURL(url);
        toast.error("Failed to upload file");
      }

      event.target.value = "";
    } catch (error: any) {
      handleError(error, "Failed to select file");
    }
  };

  const handleRemove = (file: UploadedFile | null, setter: (f: UploadedFile | null) => void) => {
    revokeUploadedFileUrl(file);
    setter(null);
  };

  const handleReset = () => {
    [
      firstFrameImage,
      lastFrameImage,
      referenceImage,
      referenceVideo,
      referenceAudio,
    ].forEach(revokeUploadedFileUrl);

    setConfigMode("form");
    setModel(selectedModel);
    setPrompt(DEFAULT_PROMPT);
    setResolution("720p");
    setDuration(5);
    setAspectRatio("16:9");
    setGenerateAudio(true);
    setSeedInput("");
    setFirstFrameImage(null);
    setLastFrameImage(null);
    setReferenceImage(null);
    setReferenceVideo(null);
    setReferenceAudio(null);
    setJsonConfig("");
  };

  const startPollingStatus = async (task_id: string) => {
    const pollStatus = async () => {
      try {
        const result = await seedance2Service.checkStatus(task_id);
        if (result.data) {
          setDisplayVideo(result.data);
          if (result.data.status === "finished" || result.data.status === "failed") {
            stopPolling();
            setIsProcessingVideo(false);
            if (result.data.status === "finished") {
              toast.success("Video generated successfully!");
            } else {
              toast.error(result.data.error_message || "Video generation failed");
            }
          } else if (
            result.data.status === "not_started" ||
            result.data.status === "running"
          ) {
            setIsProcessingVideo(true);
          }
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    };
    await pollStatus();
    intervalIdRef.current = setInterval(pollStatus, 10000);
  };

  const stopPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      [firstFrameImage, lastFrameImage, referenceImage, referenceVideo, referenceAudio].forEach(
        (f) => {
          if (f?.url.startsWith("blob:")) URL.revokeObjectURL(f.url);
        },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAnyFileUploading =
    firstFrameImage?.uploading ||
    lastFrameImage?.uploading ||
    referenceImage?.uploading ||
    referenceVideo?.uploading ||
    referenceAudio?.uploading;

  const validateForm = (): string | null => {
    if (!prompt.trim()) return "Please enter a prompt";
    if (!Number.isInteger(duration) || duration < MIN_DURATION || duration > MAX_DURATION) {
      return `Duration must be an integer between ${MIN_DURATION} and ${MAX_DURATION}`;
    }
    if (!supportedResolutions.includes(effectiveResolution)) {
      return `Resolution ${effectiveResolution} is not supported for ${model}`;
    }
    if (hasFrameImages && hasReferences) {
      return "First/last frame images cannot be used together with reference inputs";
    }
    if (seedInput.trim() && Number.isNaN(Number(seedInput))) {
      return "Seed must be a number";
    }
    return null;
  };

  const buildRequestFromForm = (): Seedance2SubmitRequest => {
    const input: Seedance2SubmitRequest["input"] = {
      prompt: prompt.trim(),
      resolution: effectiveResolution,
      duration,
      aspect_ratio: aspectRatio,
      generate_audio: generateAudio,
    };
    if (seedInput.trim()) {
      input.seed = Number(seedInput);
    }
    if (hasFrameImages) {
      const urls: string[] = [];
      if (firstFrameImage?.uploadedUrl) urls.push(firstFrameImage.uploadedUrl);
      if (lastFrameImage?.uploadedUrl) urls.push(lastFrameImage.uploadedUrl);
      if (urls.length) input.image_urls = urls;
    } else if (hasReferences) {
      if (referenceImage?.uploadedUrl) input.reference_image_urls = [referenceImage.uploadedUrl];
      if (referenceVideo?.uploadedUrl) input.reference_video_urls = [referenceVideo.uploadedUrl];
      if (referenceAudio?.uploadedUrl) input.reference_audio_urls = [referenceAudio.uploadedUrl];
    }
    return { model, input };
  };

  const handleGenerateVideo = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isAnyFileUploading) {
      toast.error("Please wait for files to finish uploading");
      return;
    }

    let request: Seedance2SubmitRequest;
    if (configMode === "json") {
      try {
        const parsed = JSON.parse(jsonConfig);
        if (!parsed?.model || !parsed?.input?.prompt) {
          toast.error("JSON must include model and input.prompt");
          return;
        }
        const parsedModel = parsed.model as Seedance2ModelId;
        const parsedResolution = parsed.input?.resolution as Seedance2Resolution | undefined;
        if (
          parsedResolution &&
          (!RESOLUTIONS_BY_MODEL[parsedModel] ||
            !RESOLUTIONS_BY_MODEL[parsedModel].includes(parsedResolution))
        ) {
          toast.error(`${parsedModel} does not support ${parsedResolution}`);
          return;
        }
        request = parsed as Seedance2SubmitRequest;
      } catch (e) {
        toast.error("Invalid JSON configuration");
        return;
      }
    } else {
      const err = validateForm();
      if (err) {
        toast.error(err);
        return;
      }
      request = buildRequestFromForm();
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setTaskId("");
      setDisplayVideo(null);
      setApiResponse(null);
      setIsProcessingVideo(true);

      // Credit check
      try {
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data.credits_amount < totalCredits) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          setIsProcessingVideo(false);
          return;
        }
      } catch (creditError) {
        console.error("Failed to check credits:", creditError);
      }

      const response = await seedance2Service.submit(request);
      setApiResponse(response);

      if (!response.data || !response.data.task_id) {
        throw new Error("Failed to generate video");
      }
      const generatedTaskId = response.data.task_id;
      setTaskId(generatedTaskId);
      toast.success("Video generation started!");
      startPollingStatus(generatedTaskId);
    } catch (error: any) {
      handleError(error, "Failed to generate video. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Render helpers -----

  const renderUploadSlot = (
    label: string,
    hint: string,
    kind: "image" | "video" | "audio",
    file: UploadedFile | null,
    setter: (f: UploadedFile | null) => void,
    filePrefix: string,
    required: boolean,
    accept: string,
    disabled: boolean = false,
  ) => (
    <div className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative w-full rounded-lg border border-border bg-background p-3">
        {file ? (
          <div className="space-y-3">
            <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden">
              {kind === "image" && (
                <img
                  src={file.url}
                  alt={label}
                  className={`w-full h-full object-contain ${file.uploading ? "opacity-50" : ""}`}
                />
              )}
              {kind === "video" && (
                <video
                  src={file.url}
                  className={`w-full h-full object-contain ${file.uploading ? "opacity-50" : ""}`}
                  controls
                  preload="metadata"
                />
              )}
              {kind === "audio" && (
                <div className="flex items-center justify-center h-full">
                  <audio
                    src={file.url}
                    controls
                    className={`w-full max-w-xs ${file.uploading ? "opacity-50" : ""}`}
                  />
                </div>
              )}
              {file.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(file, setter)}
                disabled={file.uploading}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                aria-label={`Remove ${label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept={accept}
              onChange={(e) => handleFileUpload(e, kind, setter, filePrefix)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isSubmitting || disabled}
            />
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Click to upload {kind}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
            placeholder={`{\n  "model": "${model}",\n  "input": {\n    "prompt": "...",\n    "resolution": "${effectiveResolution}",\n    "duration": 5,\n    "aspect_ratio": "16:9",\n    "generate_audio": true\n  }\n}`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("prompt")} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="A cinematic shot of a serene lake at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] max-h-[300px] resize-y"
            disabled={isSubmitting}
          />
        </div>

        {/* First + Last frame inputs (image_urls).
            Disabled when any reference_* input is provided. */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">First / Last Frame</Label>
            {hasReferences && (
              <span className="text-xs text-muted-foreground">
                Disabled while references are set
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderUploadSlot(
              "First Frame",
              "JPEG, PNG, or WebP (max 10MB)",
              "image",
              firstFrameImage,
              setFirstFrameImage,
              "seedance2-first-frame",
              false,
              "image/*",
              hasReferences,
            )}
            {renderUploadSlot(
              "Last Frame",
              "JPEG, PNG, or WebP (max 10MB)",
              "image",
              lastFrameImage,
              setLastFrameImage,
              "seedance2-last-frame",
              false,
              "image/*",
              hasReferences,
            )}
          </div>
        </div>

        {/* Reference inputs. Disabled when a first/last frame image is set. */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Reference Inputs</Label>
            {hasFrameImages && (
              <span className="text-xs text-muted-foreground">
                Disabled while frame images are set
              </span>
            )}
          </div>
          <div className="space-y-3">
            {renderUploadSlot(
              "Reference Image",
              "JPEG, PNG, or WebP (max 10MB)",
              "image",
              referenceImage,
              setReferenceImage,
              "seedance2-ref-image",
              false,
              "image/*",
              hasFrameImages,
            )}
            {renderUploadSlot(
              "Reference Video",
              "MP4, WebM, or MOV (max 50MB). Enables discounted per-second rate.",
              "video",
              referenceVideo,
              setReferenceVideo,
              "seedance2-ref-video",
              false,
              "video/*",
              hasFrameImages,
            )}
            {renderUploadSlot(
              "Reference Audio",
              "MP3, WAV, OGG, or M4A (max 20MB)",
              "audio",
              referenceAudio,
              setReferenceAudio,
              "seedance2-ref-audio",
              false,
              "audio/*",
              hasFrameImages,
            )}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Resolution</Label>
          <div className="flex gap-2">
            {supportedResolutions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={effectiveResolution === option ? "default" : "outline"}
                onClick={() => setResolution(option)}
                disabled={isSubmitting}
                className={
                  effectiveResolution === option
                    ? "flex-1"
                    : "flex-1 hover:bg-muted hover:text-foreground"
                }
              >
                {option}
              </Button>
            ))}
          </div>
          {model === "seedance-2" ? (
            <p className="text-xs text-muted-foreground">
              1080p is available on seedance-2 only.
            </p>
          ) : null}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("duration")}</Label>
            <span className="text-sm font-medium tabular-nums">{duration}s</span>
          </div>
          <Slider
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={1}
            value={[duration]}
            onValueChange={(vals) => setDuration(vals[0] ?? MIN_DURATION)}
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_DURATION}s</span>
            <span>{MAX_DURATION}s</span>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Aspect Ratio</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["16:9", "9:16", "1:1", "21:9", "4:3", "3:4"] as Seedance2AspectRatio[]).map(
              (ar) => (
                <Button
                  key={ar}
                  type="button"
                  variant={aspectRatio === ar ? "default" : "outline"}
                  className={aspectRatio === ar ? undefined : "hover:bg-muted hover:text-foreground"}
                  onClick={() => setAspectRatio(ar)}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {ar}
                </Button>
              ),
            )}
          </div>
        </div>

        {/* Seed */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seed (optional)</Label>
          <Input
            type="number"
            placeholder="e.g. 42"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Generate Audio */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Generate Audio</Label>
            <p className="text-xs text-muted-foreground">
              Produce a synchronized audio track together with the video
            </p>
          </div>
          <Switch
            checked={generateAudio}
            onCheckedChange={setGenerateAudio}
            disabled={isSubmitting}
          />
        </div>
      </div>
    );
  };

  const renderResultsPanel = () => {
    if (resultMode === "json") {
      const jsonData = displayVideo || EXAMPLE_OUTPUT;
      const isExample = !displayVideo;
      return (
        <div className="space-y-4">
          {isExample && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-500 font-medium">Example Output</p>
              <p className="text-xs text-blue-400">
                This is sample data. Generate your own video to see real results.
              </p>
            </div>
          )}
          <Label className="text-sm font-medium">Response Data</Label>
          <Textarea
            value={JSON.stringify(jsonData, null, 2)}
            readOnly
            className="min-h-[500px] font-mono text-sm bg-muted"
          />
        </div>
      );
    }

    const dataToDisplay = displayVideo || EXAMPLE_OUTPUT;
    const isExample = !displayVideo;
    const resultsBody = (
      <div className="space-y-4">
        <div className="bg-background/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Task ID:</span>
              <p className="font-mono text-xs mt-1 break-all">{dataToDisplay.task_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p
                className={`mt-1 font-medium ${
                  dataToDisplay.status === "finished"
                    ? "text-green-500"
                    : dataToDisplay.status === "failed"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {dataToDisplay.status}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="text-xs mt-1">{dataToDisplay.created_time}</p>
            </div>
            {dataToDisplay.progress !== undefined && (
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <p className="mt-1">{dataToDisplay.progress}%</p>
              </div>
            )}
          </div>

          {dataToDisplay.error_message && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500 font-medium mb-1">Error:</p>
              <p className="text-xs text-red-400">{dataToDisplay.error_message}</p>
            </div>
          )}

          {!isExample &&
            (dataToDisplay.status === "not_started" || dataToDisplay.status === "running") && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <p className="text-sm text-blue-500">
                    Generating video{generateAudio ? " with audio" : ""}...
                  </p>
                </div>
              </div>
            )}
        </div>

        {dataToDisplay.files && dataToDisplay.files.length > 0 && (
          <div className="space-y-4">
            {dataToDisplay.files
              .filter((file) => file.file_type === "video")
              .map((file, index) => (
                <div key={index} className="space-y-2">
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
                      {isExample ? "Example video" : "Video generated successfully"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={downloadingIndex === index}
                      onClick={async () => {
                        try {
                          setDownloadingIndex(index);
                          const downloadUrl = `/api/download?url=${encodeURIComponent(
                            file.file_url,
                          )}`;
                          const response = await fetch(downloadUrl);
                          if (!response.ok) throw new Error("Download failed");
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = `seedance2_${dataToDisplay.task_id}_${index}.mp4`;
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

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {isExample && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-500 font-medium">Example Output</p>
            <p className="text-xs text-blue-400">
              This is sample data. Generate your own video to see real results.
            </p>
          </div>
        )}
        <ViewportFollowPanel className="flex-1">
          {resultsBody}
        </ViewportFollowPanel>
      </div>
    );
  };

  return (
    <>
      <LoginForm
        app_name={appConfig.appName}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

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

      <div>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:gap-8 lg:grid-cols-2 items-stretch">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card className="bg-muted/50 border rounded-3xl shadow-none h-full">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div data-tool-action-boundary className="relative flex min-h-0 flex-1 flex-col gap-4">
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

                    {renderConfigPanel()}

                    <FloatingGenerateBar
                      className="mt-auto"
                      secondaryLabel="Reset"
                      actionLabel="Generate Video"
                      loadingLabel="Generating..."
                      onSecondaryClick={handleReset}
                      onClick={handleGenerateVideo}
                      secondaryDisabled={isSubmitting || !!isAnyFileUploading}
                      disabled={
                        isSubmitting ||
                        (configMode === "form" && !prompt.trim()) ||
                        !!isAnyFileUploading
                      }
                      isLoading={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Card className="bg-muted/50 border rounded-3xl shadow-none h-full">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
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

                    {renderResultsPanel()}
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

export default Seedance2;

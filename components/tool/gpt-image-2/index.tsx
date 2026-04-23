"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  gptImage2Service,
  GptImage2ModelId,
  GptImage2Size,
  GptImage2SubmitRequest,
  GptImage2StatusResponse,
} from "@/services/gptImage2Service";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, Download, Coins } from "lucide-react";
import { uploadToR2 } from "@/utils/r2";
import LoginForm from "@/components/auth/LoginForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import FloatingGenerateBar from "@/components/tool/FloatingGenerateBar";
import ViewportFollowPanel from "@/components/tool/ViewportFollowPanel";

interface GptImage2Props {
  title?: string;
  description?: string;
  locale?: string;
  selectedModel?: GptImage2ModelId;
}

type ConfigMode = "form" | "json";
type ResultMode = "preview" | "json";
type GptImage2StatusData = NonNullable<GptImage2StatusResponse["data"]>;

type UploadedFile = {
  id: string;
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIZE_OPTIONS: GptImage2Size[] = [
  "auto",
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
];
const FIXED_CREDITS = 2;

const EXAMPLE_OUTPUT: GptImage2StatusData = {
  task_id: "IMG2EXAMPLE123456",
  status: "finished",
  files: [
    {
      file_url: "https://storage.apidot.ai/models/gpt-image-2/moauzhju_98gixasw6un.webp",
      file_type: "image",
    },
  ],
  created_time: "2026-04-21T09:30:00",
  progress: 100,
  error_message: null,
};

const GptImage2 = ({ selectedModel = "gpt-image-2" }: GptImage2Props) => {
  const t = useTranslations("modelDetail.model");
  const defaultPrompt = t("gptImage2DefaultPrompt");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [configMode, setConfigMode] = useState<ConfigMode>("form");
  const [resultMode, setResultMode] = useState<ResultMode>("preview");

  const [model, setModel] = useState<GptImage2ModelId>(selectedModel);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [size, setSize] = useState<GptImage2Size>("auto");
  const [referenceImages, setReferenceImages] = useState<UploadedFile[]>([]);
  const [jsonConfig, setJsonConfig] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [displayResult, setDisplayResult] = useState<GptImage2StatusData | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const defaultPromptRef = useRef(defaultPrompt);
  const referenceImagesRef = useRef<UploadedFile[]>([]);

  useEffect(() => {
    setModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (model !== "gpt-image-2-edit" && referenceImages.length > 0) {
      referenceImages.forEach(revokeUploadedFileUrl);
      setReferenceImages([]);
    }
  }, [model, referenceImages]);

  useEffect(() => {
    if (prompt === defaultPromptRef.current) {
      setPrompt(defaultPrompt);
    }
    defaultPromptRef.current = defaultPrompt;
  }, [defaultPrompt, prompt]);

  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  useEffect(() => {
    if (configMode !== "json") return;

    const uploadedReferenceUrls = referenceImages
      .map((image) => image.uploadedUrl)
      .filter((url): url is string => Boolean(url));
    const input: GptImage2SubmitRequest["input"] = {
      prompt,
      size,
    };

    if (model === "gpt-image-2-edit" && uploadedReferenceUrls.length > 0) {
      input.image_urls = uploadedReferenceUrls;
    }

    setJsonConfig(JSON.stringify({ model, input }, null, 2));
  }, [configMode, model, prompt, referenceImages, size]);

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      referenceImagesRef.current.forEach(revokeUploadedFileUrl);
    };
  }, []);

  const isAnyFileUploading = referenceImages.some((image) => image.uploading);
  const needsReferenceImages = model === "gpt-image-2-edit";
  const uploadedReferenceUrls = referenceImages
    .map((image) => image.uploadedUrl)
    .filter((url): url is string => Boolean(url));

  const handleError = (error: any, defaultMessage: string) => {
    console.error(error);
    toast.error(error?.message || defaultMessage);
    setIsProcessingImage(false);
    setIsSubmitting(false);
  };

  const stopPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const startPollingStatus = async (taskId: string) => {
    const pollStatus = async () => {
      try {
        const result = await gptImage2Service.checkStatus(taskId);
        if (!result.data) {
          return;
        }

        setDisplayResult(result.data);

        if (result.data.status === "finished" || result.data.status === "failed") {
          stopPolling();
          setIsProcessingImage(false);

          if (result.data.status === "finished") {
            toast.success("Image generated successfully!");
          } else {
            toast.error(result.data.error_message || "Image generation failed");
          }
          return;
        }

        if (
          result.data.status === "not_started" ||
          result.data.status === "running" ||
          result.data.status === "processing"
        ) {
          setIsProcessingImage(true);
        }
      } catch (error) {
        console.error("Error polling GPT Image 2 status:", error);
      }
    };

    await pollStatus();
    intervalIdRef.current = setInterval(pollStatus, 10000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let url: string | null = null;

        try {
          if (file.size > MAX_IMAGE_SIZE) {
            throw new Error("Image exceeds 10MB limit");
          }

          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw new Error("Please upload JPEG, PNG, or WebP images only");
          }

          url = URL.createObjectURL(file);
          const pendingImage: UploadedFile = { id, file, url, uploading: true };
          setReferenceImages((current) => [...current, pendingImage]);

          const fileName = `gpt-image-2-reference-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${file.name}`;
          const result = await uploadToR2(file, fileName);

          setReferenceImages((current) =>
            current.map((image) =>
              image.id === id ? { ...image, uploadedUrl: result.url, uploading: false } : image,
            ),
          );
          return true;
        } catch (error: any) {
          if (url) {
            URL.revokeObjectURL(url);
          }
          setReferenceImages((current) => current.filter((image) => image.id !== id));
          handleError(error, "Failed to upload image");
          return false;
        }
      }),
    );

    event.target.value = "";
    const uploadedCount = uploadResults.filter(Boolean).length;

    if (uploadedCount === 0) {
      return;
    }

    if (uploadedCount === 1) {
      toast.success("Image uploaded successfully");
    } else {
      toast.success("Images uploaded successfully");
    }
  };

  const handleRemoveImage = (id: string) => {
    setReferenceImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        revokeUploadedFileUrl(target);
      }
      return current.filter((image) => image.id !== id);
    });
  };

  const handleReset = () => {
    referenceImages.forEach(revokeUploadedFileUrl);
    setConfigMode("form");
    setModel(selectedModel);
    setPrompt(defaultPrompt);
    setSize("auto");
    setReferenceImages([]);
    setJsonConfig("");
  };

  const validateForm = (): string | null => {
    if (!prompt.trim()) return "Please enter a prompt";
    if (!SIZE_OPTIONS.includes(size)) return t("gptImage2InvalidSize");
    if (needsReferenceImages && uploadedReferenceUrls.length === 0) {
      return t("gptImage2ReferenceRequired");
    }
    return null;
  };

  const buildRequestFromForm = (): GptImage2SubmitRequest => {
    const input: GptImage2SubmitRequest["input"] = {
      prompt: prompt.trim(),
      size,
    };

    if (needsReferenceImages && uploadedReferenceUrls.length > 0) {
      input.image_urls = uploadedReferenceUrls;
    }

    return {
      model,
      input,
    };
  };

  const parseJsonRequest = (): GptImage2SubmitRequest | null => {
    try {
      const parsed = JSON.parse(jsonConfig);
      const parsedModel = parsed?.model as GptImage2ModelId | undefined;
      const parsedInput = parsed?.input;

      if (!parsedModel || !parsedInput?.prompt) {
        toast.error("JSON must include model and input.prompt");
        return null;
      }

      if (!["gpt-image-2", "gpt-image-2-edit"].includes(parsedModel)) {
        toast.error("Model must be gpt-image-2 or gpt-image-2-edit");
        return null;
      }

      if (parsedInput.size && !SIZE_OPTIONS.includes(parsedInput.size as GptImage2Size)) {
        toast.error(t("gptImage2InvalidSize"));
        return null;
      }

      if (parsedInput.n !== undefined) {
        toast.error(t("gptImage2JsonNUnsupported"));
        return null;
      }

      if (parsedModel === "gpt-image-2-edit") {
        if (!Array.isArray(parsedInput.image_urls) || parsedInput.image_urls.length === 0) {
          toast.error(t("gptImage2JsonReferenceRequired"));
          return null;
        }
      }

      if (parsedModel === "gpt-image-2" && parsedInput.image_urls !== undefined) {
        toast.error(t("gptImage2JsonImageUrlsTextModelUnsupported"));
        return null;
      }

      if (
        parsedInput.image_urls !== undefined &&
        (!Array.isArray(parsedInput.image_urls) ||
          parsedInput.image_urls.some((url: unknown) => typeof url !== "string" || !url.trim()))
      ) {
        toast.error(t("gptImage2JsonImageUrlsInvalid"));
        return null;
      }

      return parsed as GptImage2SubmitRequest;
    } catch {
      toast.error("Invalid JSON configuration");
      return null;
    }
  };

  const handleGenerateImage = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isAnyFileUploading) {
      toast.error("Please wait for the upload to finish");
      return;
    }

    const request = configMode === "json" ? parseJsonRequest() : buildRequestFromForm();
    if (!request) {
      return;
    }

    if (configMode === "form") {
      const error = validateForm();
      if (error) {
        toast.error(error);
        return;
      }
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setIsProcessingImage(true);
      setDisplayResult(null);
      stopPolling();

      try {
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data.credits_amount < FIXED_CREDITS) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          setIsProcessingImage(false);
          return;
        }
      } catch (creditError) {
        console.error("Failed to check credits:", creditError);
      }

      const response = await gptImage2Service.submit(request);
      if (!response.data?.task_id) {
        throw new Error("Failed to start GPT Image 2 generation");
      }

      setDisplayResult({
        task_id: response.data.task_id,
        status: "not_started",
        files: [],
        created_time: response.data.created_time,
        progress: 0,
        error_message: null,
      });

      toast.success("Image generation started!");
      await startPollingStatus(response.data.task_id);
    } catch (error: any) {
      handleError(error, "Failed to generate image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReferenceImages = () => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {t("referenceImages")} {needsReferenceImages ? <span className="text-red-500">*</span> : null}
      </Label>
      <div className="relative w-full rounded-lg border border-border bg-background p-3">
        <div className="space-y-3">
          {referenceImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {referenceImages.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Reference"
                    className={`h-full w-full object-cover ${image.uploading ? "opacity-50" : ""}`}
                  />
                  {image.uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    disabled={image.uploading}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
                    aria-label={t("removeReferenceImage")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/60 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/20">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("uploadReferenceImages")}</p>
              <p className="text-xs text-muted-foreground">
                {t("gptImage2ReferenceImagesHelp")}
              </p>
            </div>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isSubmitting}
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderConfigPanel = () => {
    if (configMode === "json") {
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("jsonConfiguration")}</Label>
          <Textarea
            value={jsonConfig}
            onChange={(e) => setJsonConfig(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder={`{\n  "model": "gpt-image-2",\n  "input": {\n    "prompt": "A polished product hero shot",\n    "size": "auto"\n  }\n}`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("prompt")} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder={t("gptImage2PromptPlaceholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] max-h-[320px] resize-y"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("size")}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SIZE_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={size === option ? "default" : "outline"}
                className={size === option ? undefined : "hover:bg-muted hover:text-foreground"}
                onClick={() => setSize(option)}
                disabled={isSubmitting}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {needsReferenceImages ? renderReferenceImages() : null}
      </div>
    );
  };

  const renderResultsPanel = () => {
    if (resultMode === "json") {
      const jsonData = displayResult || EXAMPLE_OUTPUT;
      const isExample = !displayResult;
      return (
        <div className="space-y-4">
          {isExample ? (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <p className="text-sm font-medium text-blue-500">Example Output</p>
              <p className="text-xs text-blue-400">
                Generate your own image to replace this sample JSON.
              </p>
            </div>
          ) : null}
          <Label className="text-sm font-medium">Response Data</Label>
          <Textarea
            value={JSON.stringify(jsonData, null, 2)}
            readOnly
            className="min-h-[500px] bg-muted font-mono text-sm"
          />
        </div>
      );
    }

    const dataToDisplay = displayResult || EXAMPLE_OUTPUT;
    const isExample = !displayResult;
    const imageFiles = (dataToDisplay.files || []).filter((file) => file.file_type === "image");
    const resultsBody = (
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg bg-background/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Task ID:</span>
              <p className="mt-1 break-all font-mono text-xs">{dataToDisplay.task_id}</p>
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
              <p className="mt-1 text-xs">{dataToDisplay.created_time}</p>
            </div>
            {dataToDisplay.progress !== undefined ? (
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <p className="mt-1">{dataToDisplay.progress}%</p>
              </div>
            ) : null}
          </div>

          {dataToDisplay.error_message ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="mb-1 text-sm font-medium text-red-500">Error</p>
              <p className="text-xs text-red-400">{dataToDisplay.error_message}</p>
            </div>
          ) : null}

          {!isExample &&
          (dataToDisplay.status === "not_started" ||
            dataToDisplay.status === "running" ||
            dataToDisplay.status === "processing") ? (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-sm text-blue-500">Generating image...</p>
              </div>
            </div>
          ) : null}
        </div>

        {imageFiles.length > 0 ? (
          <div className="space-y-4">
            {imageFiles.map((file, index) => (
              <div key={`${file.file_url}-${index}`} className="space-y-2">
                <div className="overflow-hidden rounded-lg bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.file_url}
                    alt={isExample ? "Example output" : "Generated output"}
                    className="h-auto w-full rounded-lg object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {isExample ? "Example image" : "Image generated successfully"}
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
                        if (!response.ok) {
                          throw new Error("Download failed");
                        }

                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `gpt-image-2_${dataToDisplay.task_id}_${index}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                        toast.success("Image downloaded successfully!");
                      } catch (error) {
                        console.error("Download failed:", error);
                        toast.error("Failed to download image");
                      } finally {
                        setDownloadingIndex(null);
                      }
                    }}
                  >
                    {downloadingIndex === index ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {isExample ? (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-sm font-medium text-blue-500">Example Output</p>
            <p className="text-xs text-blue-400">
              Generate your own image to replace this sample preview.
            </p>
          </div>
        ) : null}
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
            <div className="space-y-2 text-center">
              <Coins className="mx-auto h-12 w-12 text-orange-500" />
              <h3 className="text-lg font-semibold">Insufficient Credits</h3>
              <p className="text-sm text-muted-foreground">
                GPT Image 2 requires {FIXED_CREDITS} credits per generation.
              </p>
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
                className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
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
        <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
          <div className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6 xl:gap-8">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card className="h-full rounded-3xl border bg-muted/50 shadow-none">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div data-tool-action-boundary className="relative flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="text-lg font-semibold">{t("input")}</div>
                      <div className="flex gap-1 rounded-lg bg-muted p-1">
                        <Button
                          size="sm"
                          variant={configMode === "form" ? "default" : "ghost"}
                          onClick={() => setConfigMode("form")}
                          className={configMode === "form" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          {t("form")}
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
                      secondaryLabel={t("reset")}
                      actionLabel={t("generateImage")}
                      loadingLabel={t("streaming")}
                      onSecondaryClick={handleReset}
                      onClick={handleGenerateImage}
                      secondaryDisabled={isSubmitting || isAnyFileUploading}
                      disabled={
                        isSubmitting ||
                        (configMode === "form" && !prompt.trim()) ||
                        isAnyFileUploading
                      }
                      isLoading={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Card className="h-full rounded-3xl border bg-muted/50 shadow-none">
                <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="text-lg font-semibold">{t("output")}</div>
                      <div className="flex gap-1 rounded-lg bg-muted p-1">
                        <Button
                          size="sm"
                          variant={resultMode === "preview" ? "default" : "ghost"}
                          onClick={() => setResultMode("preview")}
                          className={resultMode === "preview" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                        >
                          {t("preview")}
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

export default GptImage2;

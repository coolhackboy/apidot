"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "@/services/api";
import {
  musicService,
  type MiniMaxMusic26Input,
  type MusicDetailResponse,
  type MusicFile,
} from "@/services/musicService";
import { appConfig } from "@/data/config";
import minimaxMusic26Common from "@/i18n/pages/landing/minimax-music-2-6/common.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import LoginForm from "@/components/auth/LoginForm";
import FloatingGenerateBar from "@/components/tool/FloatingGenerateBar";
import ViewportFollowPanel from "@/components/tool/ViewportFollowPanel";
import { Coins, Download, Loader2, Music4 } from "lucide-react";
import { toast } from "sonner";

interface MinimaxMusic26Props {
  title?: string;
  description?: string;
  locale?: string;
}

type ConfigMode = "form" | "json";
type ResultMode = "preview" | "json";
type ResultData = NonNullable<MusicDetailResponse["data"]>;
type SampleRate = NonNullable<NonNullable<MiniMaxMusic26Input["audio_setting"]>["sample_rate"]>;
type Bitrate = NonNullable<NonNullable<MiniMaxMusic26Input["audio_setting"]>["bitrate"]>;
type AudioFormat = NonNullable<NonNullable<MiniMaxMusic26Input["audio_setting"]>["format"]>;

const FIXED_CREDITS = 20;
const SAMPLE_RATES: SampleRate[] = [16000, 24000, 32000, 44100];
const BITRATES: Bitrate[] = [32000, 64000, 128000, 256000];
const FORMATS: AudioFormat[] = ["mp3", "wav", "pcm"];

const EXAMPLE_OUTPUT: ResultData = {
  task_id: "task-music-example-20260424",
  status: "finished",
  created_time: "2026-04-24T10:12:41",
  progress: 100,
  files: [
    {
      audio_id: "audio_example_001",
      audio_url: minimaxMusic26Common.playgroundExample.audioUrl,
      image_url: minimaxMusic26Common.playgroundExample.imageUrl,
      title: "City Lights Chorus",
      duration: 122,
      prompt:
        "An uplifting indie pop song with female vocals, bright guitars, warm drums, and a clean festival-ready chorus",
      style: "indie pop",
      lyrics:
        "[Verse]\\nRun through the night, let the skyline glow\\n[Chorus]\\nWe keep the city singing as the neon rivers flow",
    },
  ],
};

const buildLocalizedCopy = (isZh: boolean) =>
  isZh
    ? {
        defaultPrompt:
          "一首明亮有力的 indie pop 歌曲，女声主唱，温暖鼓组，清晰副歌，适合节日氛围",
        defaultLyrics:
          "[Verse]\\n我们穿过城市灯海 听见节奏慢慢醒来\\n[Chorus]\\n今晚的风会把歌声带向更远的未来",
        input: "输入",
        output: "输出",
        form: "表单",
        json: "JSON",
        preview: "预览",
        prompt: "Prompt",
        lyrics: "Lyrics",
        callbackUrl: "Callback URL",
        lyricsOptimize: "Lyrics Optimize",
        lyricsOptimizeHint: "没有完整歌词时，用提示词辅助生成歌词结构。",
        instrumental: "Instrumental Mode",
        instrumentalHint: "只生成纯音乐，不输出人声。",
        sampleRate: "Sample Rate",
        bitrate: "Bitrate",
        format: "Format",
        taskId: "Task ID",
        status: "状态",
        created: "创建时间",
        progress: "进度",
        promptPlaceholder: "描述风格、情绪、节奏、配器和人声方向...",
        lyricsPlaceholder: "输入歌词；如果没有歌词，可以开启 Lyrics Optimize 或 Instrumental Mode。",
        noLyricsRequired: "当前配置下歌词不是必填。",
        lyricsRequired: "当 Lyrics Optimize 和 Instrumental 都关闭时，歌词必填。",
        callbackPlaceholder: "https://your-domain.com/callback",
        jsonPlaceholder:
          '{\n  "model": "minimax-music-2.6",\n  "callback_url": "https://your-domain.com/callback",\n  "input": {\n    "prompt": "一首明亮有力的 indie pop 歌曲，女声主唱，温暖鼓组，清晰副歌，适合节日氛围",\n    "lyrics_optimizer": true,\n    "audio_setting": {\n      "sample_rate": 44100,\n      "bitrate": 256000,\n      "format": "mp3"\n    }\n  }\n}',
        exampleTitle: "示例输出",
        exampleDescription: "提交任务后，这里会显示真实生成结果和音频预览。",
        generating: "生成中...",
        generatingMusic: "音乐生成中...",
        generateAction: "生成音乐",
        reset: "重置",
        insufficientCreditsTitle: "积分不足",
        insufficientCreditsBody: "MiniMax Music 2.6 每次生成需要 20 credits。",
        rechargeNow: "立即充值",
        cancel: "取消",
        download: "下载",
        downloading: "下载中...",
        validationPromptRequired: "请先填写 prompt。",
        validationPromptLength: "prompt 长度需在 10 到 2000 字符之间。",
        validationLyricsLength: "lyrics 不能超过 3500 字符。",
        validationLyricsRequired: "当 Lyrics Optimize 和 Instrumental 都关闭时，必须提供歌词。",
        validationInvalidJson: "JSON 配置格式无效。",
        validationModel: "JSON 中的 model 必须是 minimax-music-2.6。",
        validationAudioSetting: "audio_setting 只支持 sample_rate、bitrate、format。",
        validationCallbackUrl: "callback_url 必须是合法的 URL。",
        submitStarted: "音乐任务已提交。",
        submitFailed: "提交失败，请稍后重试。",
        generationFailed: "音乐生成失败。",
        generationFinished: "音乐生成完成。",
        emptyState: "提交任务后，这里会显示 task 状态、音频预览和返回 JSON。",
      }
    : {
        defaultPrompt:
          "An uplifting indie pop song with female vocals, bright guitars, warm drums, and a clean festival-ready chorus",
        defaultLyrics:
          "[Verse]\\nWe run beneath the city lights, hearing every window sing\\n[Chorus]\\nTonight we lift the skyline higher than the rush of everything",
        input: "Input",
        output: "Output",
        form: "Form",
        json: "JSON",
        preview: "Preview",
        prompt: "Prompt",
        lyrics: "Lyrics",
        callbackUrl: "Callback URL",
        lyricsOptimize: "Lyrics Optimize",
        lyricsOptimizeHint: "Use prompt-driven lyric assistance when full lyrics are not ready.",
        instrumental: "Instrumental Mode",
        instrumentalHint: "Generate instrumental-only music without vocals.",
        sampleRate: "Sample Rate",
        bitrate: "Bitrate",
        format: "Format",
        taskId: "Task ID",
        status: "Status",
        created: "Created",
        progress: "Progress",
        promptPlaceholder: "Describe genre, mood, pacing, instrumentation, and vocal direction...",
        lyricsPlaceholder:
          "Paste lyrics here. If you do not have lyrics yet, enable Lyrics Optimize or Instrumental Mode.",
        noLyricsRequired: "Lyrics are optional with the current configuration.",
        lyricsRequired: "Lyrics are required when both Lyrics Optimize and Instrumental Mode are off.",
        callbackPlaceholder: "https://your-domain.com/callback",
        jsonPlaceholder:
          '{\n  "model": "minimax-music-2.6",\n  "callback_url": "https://your-domain.com/callback",\n  "input": {\n    "prompt": "An uplifting indie pop song with female vocals, bright guitars, warm drums, and a clean festival-ready chorus",\n    "lyrics_optimizer": true,\n    "audio_setting": {\n      "sample_rate": 44100,\n      "bitrate": 256000,\n      "format": "mp3"\n    }\n  }\n}',
        exampleTitle: "Example Output",
        exampleDescription: "Real task status, audio preview, and metadata will appear here after submit.",
        generating: "Generating...",
        generatingMusic: "Generating music...",
        generateAction: "Generate Music",
        reset: "Reset",
        insufficientCreditsTitle: "Insufficient Credits",
        insufficientCreditsBody: "MiniMax Music 2.6 requires 20 credits per generation.",
        rechargeNow: "Recharge Now",
        cancel: "Cancel",
        download: "Download",
        downloading: "Downloading...",
        validationPromptRequired: "Please enter a prompt.",
        validationPromptLength: "Prompt length must be between 10 and 2000 characters.",
        validationLyricsLength: "Lyrics cannot exceed 3500 characters.",
        validationLyricsRequired: "Lyrics are required when both Lyrics Optimize and Instrumental Mode are off.",
        validationInvalidJson: "Invalid JSON configuration.",
        validationModel: "JSON model must be minimax-music-2.6.",
        validationAudioSetting: "audio_setting only supports sample_rate, bitrate, and format.",
        validationCallbackUrl: "callback_url must be a valid URL.",
        submitStarted: "Music generation started.",
        submitFailed: "Failed to submit the request. Please try again.",
        generationFailed: "Music generation failed.",
        generationFinished: "Music generation completed.",
        emptyState: "Task status, audio preview, and response JSON will appear here after you submit.",
      };

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const buildRequestPayload = ({
  prompt,
  lyrics,
  lyricsOptimizer,
  isInstrumental,
  sampleRate,
  bitrate,
  format,
  callbackUrl,
}: {
  prompt: string;
  lyrics: string;
  lyricsOptimizer: boolean;
  isInstrumental: boolean;
  sampleRate: SampleRate;
  bitrate: Bitrate;
  format: AudioFormat;
  callbackUrl: string;
}) => {
  const input: MiniMaxMusic26Input = {
    prompt: prompt.trim(),
    audio_setting: {
      sample_rate: sampleRate,
      bitrate,
      format,
    },
  };

  if (lyrics.trim()) {
    input.lyrics = lyrics.trim();
  }

  if (lyricsOptimizer) {
    input.lyrics_optimizer = true;
  }

  if (isInstrumental) {
    input.is_instrumental = true;
  }

  return {
    model: "minimax-music-2.6" as const,
    ...(callbackUrl.trim() ? { callback_url: callbackUrl.trim() } : {}),
    input,
  };
};

export default function MinimaxMusic26({ locale }: MinimaxMusic26Props) {
  const isZh = locale?.startsWith("zh");
  const copy = useMemo(() => buildLocalizedCopy(Boolean(isZh)), [isZh]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>("form");
  const [resultMode, setResultMode] = useState<ResultMode>("preview");
  const [prompt, setPrompt] = useState(copy.defaultPrompt);
  const [lyrics, setLyrics] = useState(copy.defaultLyrics);
  const [lyricsOptimizer, setLyricsOptimizer] = useState(false);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [sampleRate, setSampleRate] = useState<SampleRate>(44100);
  const [bitrate, setBitrate] = useState<Bitrate>(256000);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [jsonConfig, setJsonConfig] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayResult, setDisplayResult] = useState<ResultData | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  useEffect(() => {
    setPrompt(copy.defaultPrompt);
    setLyrics(copy.defaultLyrics);
  }, [copy.defaultPrompt, copy.defaultLyrics]);

  useEffect(() => {
    if (isInstrumental && lyricsOptimizer) {
      setLyricsOptimizer(false);
    }
  }, [isInstrumental, lyricsOptimizer]);

  useEffect(() => {
    if (configMode !== "json") {
      return;
    }

    const payload = buildRequestPayload({
      prompt,
      lyrics,
      lyricsOptimizer,
      isInstrumental,
      sampleRate,
      bitrate,
      format,
      callbackUrl,
    });
    setJsonConfig(JSON.stringify(payload, null, 2));
  }, [configMode, prompt, lyrics, lyricsOptimizer, isInstrumental, sampleRate, bitrate, format, callbackUrl]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleError = (error: unknown, fallback: string) => {
    console.error(error);
    toast.error(error instanceof Error ? error.message : fallback);
    setIsSubmitting(false);
    setIsProcessing(false);
  };

  const validatePayload = (payload: {
    model: string;
    callback_url?: string;
    input?: MiniMaxMusic26Input;
  }) => {
    if (payload.model !== "minimax-music-2.6") {
      throw new Error(copy.validationModel);
    }

    if (!payload.input?.prompt?.trim()) {
      throw new Error(copy.validationPromptRequired);
    }

    const promptLength = payload.input.prompt.trim().length;
    if (promptLength < 10 || promptLength > 2000) {
      throw new Error(copy.validationPromptLength);
    }

    const lyricsValue = payload.input.lyrics?.trim() || "";
    if (lyricsValue.length > 3500) {
      throw new Error(copy.validationLyricsLength);
    }

    if (!lyricsValue && !payload.input.lyrics_optimizer && !payload.input.is_instrumental) {
      throw new Error(copy.validationLyricsRequired);
    }

    if (payload.callback_url && !isValidUrl(payload.callback_url)) {
      throw new Error(copy.validationCallbackUrl);
    }

    const audioSetting = payload.input.audio_setting;
    if (!audioSetting) {
      return;
    }

    if (
      audioSetting.sample_rate !== undefined &&
      !SAMPLE_RATES.includes(audioSetting.sample_rate as SampleRate)
    ) {
      throw new Error(copy.validationAudioSetting);
    }

    if (
      audioSetting.bitrate !== undefined &&
      !BITRATES.includes(audioSetting.bitrate as Bitrate)
    ) {
      throw new Error(copy.validationAudioSetting);
    }

    if (
      audioSetting.format !== undefined &&
      !FORMATS.includes(audioSetting.format as AudioFormat)
    ) {
      throw new Error(copy.validationAudioSetting);
    }
  };

  const parseJsonPayload = () => {
    try {
      const parsed = JSON.parse(jsonConfig) as {
        model: string;
        callback_url?: string;
        input?: MiniMaxMusic26Input;
      };
      validatePayload(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(copy.validationInvalidJson);
    }
  };

  const buildFormPayload = () => {
    const payload = buildRequestPayload({
      prompt,
      lyrics,
      lyricsOptimizer,
      isInstrumental,
      sampleRate,
      bitrate,
      format,
      callbackUrl,
    });
    validatePayload(payload);
    return payload;
  };

  const startPolling = async (taskId: string) => {
    const poll = async () => {
      try {
        const response = await musicService.queryDetail(taskId);
        if (!response.data) {
          return;
        }

        setDisplayResult(response.data);

        if (response.data.status === "finished" || response.data.status === "failed") {
          stopPolling();
          setIsProcessing(false);

          if (response.data.status === "finished") {
            toast.success(copy.generationFinished);
          } else {
            toast.error(response.data.error_message || copy.generationFailed);
          }
        } else {
          setIsProcessing(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    await poll();
    intervalRef.current = setInterval(poll, 10000);
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      const payload = configMode === "json" ? parseJsonPayload() : buildFormPayload();

      setIsSubmitting(true);
      setIsProcessing(true);
      setDisplayResult(null);
      stopPolling();

      try {
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if (userInfo.data.credits_amount < FIXED_CREDITS) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          setIsProcessing(false);
          return;
        }
      } catch (creditError) {
        console.error("Failed to check credits:", creditError);
      }

      const response = await musicService.submit(
        "minimax-music-2.6",
        payload.input || {},
        payload.callback_url,
      );

      if (!response.data?.task_id) {
        throw new Error(copy.submitFailed);
      }

      setDisplayResult({
        task_id: response.data.task_id,
        status: (response.data.status as ResultData["status"]) || "not_started",
        created_time: response.data.created_time,
        progress: 0,
        files: [],
      });

      toast.success(copy.submitStarted);
      await startPolling(response.data.task_id);
    } catch (error) {
      handleError(error, copy.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setConfigMode("form");
    setResultMode("preview");
    setPrompt(copy.defaultPrompt);
    setLyrics(copy.defaultLyrics);
    setLyricsOptimizer(false);
    setIsInstrumental(false);
    setSampleRate(44100);
    setBitrate(256000);
    setFormat("mp3");
    setCallbackUrl("");
    setJsonConfig("");
    setDisplayResult(null);
    setIsSubmitting(false);
    setIsProcessing(false);
  };

  const handleDownload = async (fileUrl: string, index: number) => {
    try {
      setDownloadingUrl(`${fileUrl}-${index}`);
      const response = await fetch(`/api/download?url=${encodeURIComponent(fileUrl)}`);
      if (!response.ok) {
        throw new Error(copy.download);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `minimax-music-2.6-${index}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      toast.error(copy.download);
    } finally {
      setDownloadingUrl(null);
    }
  };

  const dataToDisplay = displayResult || EXAMPLE_OUTPUT;
  const isExample = !displayResult;
  const lyricsRequired = !lyricsOptimizer && !isInstrumental;

  const renderConfigPanel = () => {
    if (configMode === "json") {
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">JSON</Label>
          <Textarea
            value={jsonConfig}
            onChange={(event) => setJsonConfig(event.target.value)}
            className="min-h-[520px] font-mono text-sm"
            placeholder={copy.jsonPlaceholder}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {copy.prompt} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[120px] resize-y"
            placeholder={copy.promptPlaceholder}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">10-2000</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{copy.instrumental}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.instrumentalHint}</p>
              </div>
              <Switch
                checked={isInstrumental}
                onCheckedChange={setIsInstrumental}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{copy.lyricsOptimize}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.lyricsOptimizeHint}</p>
              </div>
              <Switch
                checked={lyricsOptimizer}
                onCheckedChange={setLyricsOptimizer}
                disabled={isSubmitting || isInstrumental}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {copy.lyrics} {lyricsRequired ? <span className="text-red-500">*</span> : null}
          </Label>
          <Textarea
            value={lyrics}
            onChange={(event) => setLyrics(event.target.value)}
            className="min-h-[160px] resize-y"
            placeholder={copy.lyricsPlaceholder}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            {lyricsRequired ? copy.lyricsRequired : copy.noLyricsRequired}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{copy.sampleRate}</Label>
            <Select
              value={String(sampleRate)}
              onValueChange={(value) => setSampleRate(Number(value) as SampleRate)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_RATES.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{copy.bitrate}</Label>
            <Select
              value={String(bitrate)}
              onValueChange={(value) => setBitrate(Number(value) as Bitrate)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BITRATES.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{copy.format}</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as AudioFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
    );
  };

  const renderAudioCard = (file: MusicFile, index: number) => {
    const downloadKey = `${file.audio_url}-${index}`;

    return (
      <div
        key={`${file.audio_id || file.audio_url || index}`}
        className="space-y-4 rounded-2xl border border-border bg-background/70 p-4"
      >
        {file.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.image_url}
            alt={file.title || `music-cover-${index}`}
            className="h-48 w-full rounded-xl object-cover"
          />
        ) : null}

        {file.audio_url ? (
          <audio controls src={file.audio_url} className="w-full">
            Your browser does not support the audio element.
          </audio>
        ) : null}

        {file.audio_url ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingUrl === downloadKey}
              onClick={() => handleDownload(file.audio_url!, index)}
            >
              {downloadingUrl === downloadKey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.downloading}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {copy.download}
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderResultsPanel = () => {
    if (resultMode === "json") {
      return (
        <div className="space-y-4">
          {isExample ? (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <p className="text-sm font-medium text-blue-500">{copy.exampleTitle}</p>
              <p className="text-xs text-blue-400">{copy.exampleDescription}</p>
            </div>
          ) : null}
          <Label className="text-sm font-medium">Response Data</Label>
          <Textarea
            value={JSON.stringify(dataToDisplay, null, 2)}
            readOnly
            className="min-h-[520px] bg-muted font-mono text-sm"
          />
        </div>
      );
    }

    const statusColor =
      dataToDisplay.status === "finished"
        ? "text-green-500"
        : dataToDisplay.status === "failed"
          ? "text-red-500"
          : "text-yellow-500";

    const resultsBody = (
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl bg-background/70 p-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">{copy.taskId}:</span>
              <p className="mt-1 break-all font-mono text-xs">{dataToDisplay.task_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{copy.status}:</span>
              <p className={`mt-1 font-medium ${statusColor}`}>{dataToDisplay.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{copy.created}:</span>
              <p className="mt-1 text-xs">{dataToDisplay.created_time || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{copy.progress}:</span>
              <p className="mt-1">
                {typeof dataToDisplay.progress === "number" ? `${dataToDisplay.progress}%` : "-"}
              </p>
            </div>
          </div>

          {!isExample && (dataToDisplay.status === "not_started" || dataToDisplay.status === "running") ? (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{copy.generatingMusic}</span>
            </div>
          ) : null}
        </div>

        {dataToDisplay.files?.length ? (
          <div className="space-y-4">{dataToDisplay.files.map(renderAudioCard)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-8 text-center">
            <Music4 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {!isExample && isProcessing ? copy.generatingMusic : copy.emptyState}
            </p>
          </div>
        )}
      </div>
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {isExample ? (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-sm font-medium text-blue-500">{copy.exampleTitle}</p>
            <p className="text-xs text-blue-400">{copy.exampleDescription}</p>
          </div>
        ) : null}
        <ViewportFollowPanel className="flex-1">{resultsBody}</ViewportFollowPanel>
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
              <h3 className="text-lg font-semibold">{copy.insufficientCreditsTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.insufficientCreditsBody}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpgradeModal(false)}>
                {copy.cancel}
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
                onClick={() => window.open("/dashboard/billing", "_blank")}
              >
                {copy.rechargeNow}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
        <div className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6 xl:gap-8">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <Card className="h-full rounded-3xl border bg-muted/50 shadow-none">
              <CardContent className="flex h-full flex-col p-3 sm:p-4 lg:p-6">
                <div data-tool-action-boundary className="relative flex min-h-0 flex-1 flex-col gap-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="text-lg font-semibold">{copy.input}</div>
                    <div className="flex gap-1 rounded-lg bg-muted p-1">
                      <Button
                        size="sm"
                        variant={configMode === "form" ? "default" : "ghost"}
                        onClick={() => setConfigMode("form")}
                        className={configMode === "form" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                      >
                        {copy.form}
                      </Button>
                      <Button
                        size="sm"
                        variant={configMode === "json" ? "default" : "ghost"}
                        onClick={() => setConfigMode("json")}
                        className={configMode === "json" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                      >
                        {copy.json}
                      </Button>
                    </div>
                  </div>

                  {renderConfigPanel()}

                  <FloatingGenerateBar
                    className="mt-auto"
                    secondaryLabel={copy.reset}
                    actionLabel={copy.generateAction}
                    loadingLabel={copy.generating}
                    onSecondaryClick={handleReset}
                    onClick={handleGenerate}
                    secondaryDisabled={isSubmitting}
                    disabled={isSubmitting || (configMode === "form" && !prompt.trim())}
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
                    <div className="text-lg font-semibold">{copy.output}</div>
                    <div className="flex gap-1 rounded-lg bg-muted p-1">
                      <Button
                        size="sm"
                        variant={resultMode === "preview" ? "default" : "ghost"}
                        onClick={() => setResultMode("preview")}
                        className={resultMode === "preview" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                      >
                        {copy.preview}
                      </Button>
                      <Button
                        size="sm"
                        variant={resultMode === "json" ? "default" : "ghost"}
                        onClick={() => setResultMode("json")}
                        className={resultMode === "json" ? "h-8" : "h-8 hover:bg-muted hover:text-foreground"}
                      >
                        {copy.json}
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
    </>
  );
}

import { apiService } from "./api";
import { appConfig } from "@/data/config";

// 模型类型定义
export type MusicModel =
  | "generate-music"
  | "extend-music"
  | "upload-and-cover-audio"
  | "upload-and-extend-audio"
  | "add-instrumental"
  | "add-vocals"
  | "get-timestamped-lyrics"
  | "boost-music-style"
  | "generate-music-cover"
  | "replace-section"
  | "generate-persona"
  | "generate-lyrics"
  | "convert-to-wav"
  | "separate-vocals"
  | "stem-split"
  | "upload-and-separate-vocals"
  | "generate-midi"
  | "create-music-video"
  | "minimax-music-2.6";

// 模型版本
export type MusicModelVersion = "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5";

// 通用输入接口
export interface MusicInputBase {
  callback_url?: string;
}

// Generate Music 输入
export interface GenerateMusicInput extends MusicInputBase {
  prompt: string;
  custom_mode: boolean;
  instrumental: boolean;
  mv: MusicModelVersion;
  style?: string;
  title?: string;
  negative_tags?: string;
  vocal_gender?: "m" | "f";
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
  persona_id?: string;
}

// Extend Music 输入
export interface ExtendMusicInput extends MusicInputBase {
  audio_id: string;
  continue_at?: number;
  default_param_flag: boolean;
  prompt?: string;
  style?: string;
  title?: string;
  mv?: MusicModelVersion;
  negative_tags?: string;
  vocal_gender?: "m" | "f";
  style_weight?: number;
  weirdness_constraint?: number;
}

// Upload and Cover Audio 输入
export interface UploadAndCoverAudioInput extends MusicInputBase {
  upload_url: string;
  prompt: string;
  custom_mode: boolean;
  instrumental: boolean;
  mv: MusicModelVersion;
  style?: string;
  title?: string;
  negative_tags?: string;
  vocal_gender?: "m" | "f";
  style_weight?: number;
}

// Upload and Extend Audio 输入
export interface UploadAndExtendAudioInput extends MusicInputBase {
  upload_url: string;
  continue_at?: number;
  prompt?: string;
  custom_mode?: boolean;
  mv?: MusicModelVersion;
  style?: string;
  title?: string;
}

// Add Instrumental 输入
export interface AddInstrumentalInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
  style?: string;
  mv?: MusicModelVersion;
  negative_tags?: string;
  style_weight?: number;
  weirdness_constraint?: number;
}

// Add Vocals 输入
export interface AddVocalsInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
  lyrics?: string;
  prompt?: string;
  vocal_gender?: "m" | "f";
  style?: string;
  mv?: MusicModelVersion;
}

// Get Timestamped Lyrics 输入
export interface GetTimestampedLyricsInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Boost Music Style 输入
export interface BoostMusicStyleInput extends MusicInputBase {
  style: string;
}

// Generate Music Cover 输入
export interface GenerateMusicCoverInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Replace Section 输入
export interface ReplaceSectionInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
  start_s: number;
  end_s: number;
  prompt?: string;
  style?: string;
  title?: string;
  mv?: MusicModelVersion;
}

// Generate Persona 输入
export interface GeneratePersonaInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Generate Lyrics 输入
export interface GenerateLyricsInput extends MusicInputBase {
  prompt: string;
}

// Convert to WAV 输入
export interface ConvertToWavInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Separate Vocals 输入
export interface SeparateVocalsInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Generate MIDI 输入
export interface GenerateMidiInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
}

// Create Music Video 输入
export interface CreateMusicVideoInput extends MusicInputBase {
  task_id: string;
  audio_id: string;
  author?: string;
  domain_name?: string;
}

export interface MiniMaxMusic26Input extends MusicInputBase {
  prompt: string;
  lyrics?: string;
  lyrics_optimizer?: boolean;
  is_instrumental?: boolean;
  audio_setting?: {
    sample_rate?: 16000 | 24000 | 32000 | 44100;
    bitrate?: 32000 | 64000 | 128000 | 256000;
    format?: "mp3" | "wav" | "pcm";
  };
}

// 时间戳歌词
export interface TimestampedLyric {
  start: number;
  end: number;
  text: string;
}

// 音乐文件
export interface MusicFile {
  audio_url?: string;
  image_url?: string;
  wav_url?: string;
  video_url?: string;
  vocals_url?: string;
  instrumental_url?: string;
  midi_url?: string;
  lyrics?: string;
  timestamped_lyrics?: TimestampedLyric[];
  persona_id?: string;
  enhanced_style?: string;
  title?: string;
  style?: string;
  audio_id?: string;
}

// 提交响应
export interface MusicSubmitResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status?: string;
    created_time?: string;
  };
}

// 详情响应
export interface MusicDetailResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: "not_started" | "running" | "finished" | "failed";
    files?: MusicFile[];
    created_time?: string;
    error_message?: string;
    progress?: number;
  };
}

// 服务实现
export const musicService = {
  async submit(model: MusicModel, input: object): Promise<MusicSubmitResponse> {
    const response = await apiService.post(
      "/api/generate/submit",
      { model, input },
      appConfig.appName
    );

    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || "Submit failed");
    }
    return response;
  },

  async queryDetail(taskId: string): Promise<MusicDetailResponse> {
    const response = await apiService.get(
      `/api/generate/detail/music?task_id=${taskId}`,
      appConfig.appName
    );

    if (response.code !== 200 && response.code !== 0) {
      throw new Error(response.message || "Query failed");
    }
    return response;
  },
};

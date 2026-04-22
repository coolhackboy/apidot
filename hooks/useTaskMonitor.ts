import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface TaskMonitorState {
  runningTasks: Record<string, boolean>;
  isChecking: boolean;
  lastCheckTime: number;
  shouldStopPolling: boolean; // 是否应该停止轮询
}

interface TaskMonitorOptions {
  onTasksCompleted?: (completedTasks: string[]) => void;
  pollingInterval?: number;
  enableAutoPolling?: boolean;
  featureCodes?: string[];
  stopOnAllFalse?: boolean; // 当所有任务都为false时完全停止轮询
}

export const useTaskMonitor = (
  options: TaskMonitorOptions = {}
) => {
  const {
    onTasksCompleted,
    pollingInterval = 5000, // 5秒轮询
    enableAutoPolling = true,
    featureCodes = [],
    stopOnAllFalse = true // 默认开启：所有任务为false时停止轮询
  } = options;

  const [state, setState] = useState<TaskMonitorState>({
    runningTasks: {},
    isChecking: false,
    lastCheckTime: 0,
    shouldStopPolling: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousRunningTasksRef = useRef<Record<string, boolean>>({});

  // 检查任务状态
  const checkRunningTasks = useCallback(async (isManualCheck = false, isPollingCheck = false) => {
    try {
      setState(prev => ({ ...prev, isChecking: true }));

      const response = await apiService.check_running_tasks(featureCodes);

      if (response.code === 200) {
        const newRunningTasks = response.data || {};
        const previousRunningTasks = previousRunningTasksRef.current;

        // 检测状态变化：从 true 变 false = 任务完成
        const completedTasks = Object.keys(previousRunningTasks).filter(
          code => previousRunningTasks[code] && !newRunningTasks[code]
        );

        // 检查是否应该停止轮询
        const hasRunningTasks = Object.values(newRunningTasks).some(Boolean);
        const hasNoTasks = Object.keys(newRunningTasks).length === 0;
        const allTasksFalse = Object.keys(newRunningTasks).length > 0 && !hasRunningTasks;

        // 停止轮询的条件：启用stopOnAllFalse且(无任务或所有任务都为false)
        const shouldStop = stopOnAllFalse && (hasNoTasks || allTasksFalse);

        // 如果是手动检查且发现有运行中的任务，应该恢复轮询
        const shouldResume = isManualCheck && hasRunningTasks;

        setState(prev => ({
          ...prev,
          runningTasks: newRunningTasks,
          isChecking: false,
          lastCheckTime: Date.now(),
          shouldStopPolling: shouldResume ? false : shouldStop
        }));

        // 更新引用
        previousRunningTasksRef.current = newRunningTasks;

        // 任务真正完成时触发回调，无论是轮询还是手动检查
        if (completedTasks.length > 0) {
          onTasksCompleted?.(completedTasks);
        }

        return completedTasks;
      }

      setState(prev => ({ ...prev, isChecking: false }));
      return [];
    } catch (error) {
      setState(prev => ({ ...prev, isChecking: false }));
      return [];
    }
  }, [onTasksCompleted, featureCodes, stopOnAllFalse]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      // 轮询检查任务状态
      await checkRunningTasks(false, true);
    }, pollingInterval);
  }, [checkRunningTasks, pollingInterval]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 恢复轮询
  const resumePolling = useCallback(() => {
    setState(prev => ({
      ...prev,
      shouldStopPolling: false
    }));

    if (enableAutoPolling) {
      startPolling();
    }
  }, [enableAutoPolling, startPolling]);

  // 手动检查一次
  const manualCheck = useCallback(async () => {
    const result = await checkRunningTasks(true, false);
    return result;
  }, [checkRunningTasks]);

  // 自动轮询管理
  useEffect(() => {
    if (enableAutoPolling && !state.shouldStopPolling) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enableAutoPolling, state.shouldStopPolling, startPolling, stopPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    // 状态
    runningTasks: state.runningTasks,
    isChecking: state.isChecking,
    lastCheckTime: state.lastCheckTime,
    shouldStopPolling: state.shouldStopPolling,

    // 计算属性
    hasRunningTasks: Object.values(state.runningTasks).some(Boolean),
    runningTasksCount: Object.values(state.runningTasks).filter(Boolean).length,

    // 方法
    checkRunningTasks: manualCheck,
    startPolling,
    stopPolling,
    resumePolling,

    // 工具方法
    isTaskRunning: (featureCode: string) => state.runningTasks[featureCode] || false,
    getRunningFeatureCodes: () => Object.keys(state.runningTasks).filter(code => state.runningTasks[code])
  };
};

// 获取模式名称的工具函数
export const getModeName = (featureCode: string): string => {
  const modeMap: Record<string, string> = {
    // Image-to-video
    "15000385": "Basic",
    "15000386": "Fast", 
    "15000387": "Pro",
    "15000388": "Ultra",
    // Text-to-video
    "15000389": "Basic",
    "15000390": "Pro"
  };
  return modeMap[featureCode] || "Basic";
};

// 获取预计时间的工具函数
export const getEstimatedTime = (featureCode: string): string => {
  const timeMap: Record<string, string> = {
    // Image-to-video
    "15000385": "10-15 minutes",
    "15000386": "3-5 minutes", 
    "15000387": "1-2 minutes",
    "15000388": "1-2 minutes",
    // Text-to-video
    "15000389": "5-10 minutes",
    "15000390": "1-3 minutes"
  };
  return timeMap[featureCode] || "10 seconds";
};
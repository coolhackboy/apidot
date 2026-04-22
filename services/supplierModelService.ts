import { apiService } from "./api";
import { appConfig } from "@/data/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface SupplierModel {
  model_code: string;
  model_name: string;
  submit_uri: string;
  supplier_name: string;
}

export interface ListSupplierModelsParams {
  page?: number;
  page_size?: number;
  model_code?: string; // 支持逗号分隔多个
  keyword?: string; // 模糊查询 model_name 或 supplier_name
}

export interface SupplierModelListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SupplierModel[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = apiService.getAppToken(appConfig.appName);
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const supplierModelService = {
  /**
   * 获取供应商模型列表
   */
  async listSupplierModels(
    params: ListSupplierModelsParams = {}
  ): Promise<SupplierModelListResponse> {
    try {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params.model_code)
        queryParams.append("model_code", params.model_code);
      if (params.keyword)
        queryParams.append("keyword", params.keyword);

      const url = `${API_URL}/api/admin/supplier/models${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to list supplier models");
      }

      const result = await response.json();
      if (result.code === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to list supplier models");
    } catch (error) {
      console.error("Error listing supplier models:", error);
      throw error;
    }
  },

  /**
   * 批量获取 model_code 对应的供应商信息(用于列表展示)
   * @param modelCodes model_code 数组
   * @returns 供应商模型列表
   */
  async getSupplierModelsByCode(
    modelCodes: string[]
  ): Promise<SupplierModel[]> {
    if (!modelCodes || modelCodes.length === 0) {
      return [];
    }

    try {
      // 去重并过滤空值
      const uniqueCodes = Array.from(
        new Set(modelCodes.filter((code) => code && code.trim()))
      );

      if (uniqueCodes.length === 0) {
        return [];
      }

      const response = await this.listSupplierModels({
        model_code: uniqueCodes.join(","),
        page: 1,
        page_size: 1000, // 设置足够大的 page_size 以获取所有结果
      });

      return response.items || [];
    } catch (error) {
      console.error("Error getting supplier models by code:", error);
      return [];
    }
  },

  /**
   * 创建 model_code -> SupplierModel 的映射
   * @param models 供应商模型列表
   * @returns Map<model_code, SupplierModel>
   */
  createSupplierModelMap(
    models: SupplierModel[]
  ): Map<string, SupplierModel> {
    const map = new Map<string, SupplierModel>();
    models.forEach((model) => {
      if (model.model_code) {
        map.set(model.model_code, model);
      }
    });
    return map;
  },
};

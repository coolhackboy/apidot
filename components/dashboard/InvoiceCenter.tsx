"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  apiService,
  InvoiceProfileData,
  OrderInvoiceData,
  PaymentRecordData,
  WechatInvoiceApplyRequest,
} from "@/services/api";
import { appConfig } from "@/data/config";
import LoginForm from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileText,
  Loader2,
  ReceiptText,
  User,
} from "lucide-react";

const EMPTY_PROFILE: InvoiceProfileData = {
  is_company: false,
  company_name: "",
  tax_no: "",
  country_region: "",
  postal_code: "",
  state_province: "",
  city: "",
  address: "",
};

const EMPTY_WECHAT_FORM: WechatInvoiceApplyRequest = {
  invoice_title: "",
  tax_no: "",
  invoice_kind: "normal",
  invoice_item: "",
  remark: "",
};

function isZhLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequiredMark() {
  return <span className="ml-1 font-semibold text-red-500">*</span>;
}

export default function InvoiceCenter() {
  const locale = useLocale();
  const tBilling = useTranslations("Dashboard.Billing");
  const searchParams = useSearchParams();
  const isZh = isZhLocale(locale);

  const text = useMemo(
    () =>
      isZh
        ? {
            title: "发票中心",
            description: "统一处理微信开票申请、默认开票资料和发票下载。",
            profileTitle: "默认开票资料",
            profileDesc: "其它支付通道会基于这份资料生成 PDF 发票。",
            editProfile: "编辑开票资料",
            profileHint: "微信订单按订单提交申请，其他通道使用默认资料自动生成。",
            recordsTitle: "发票记录",
            recordsDesc: "按订单查看当前发票状态并执行对应动作。",
            columnOrder: "订单号",
            columnChannel: "通道",
            columnStatus: "状态",
            columnCreated: "创建时间",
            columnAction: "操作",
            channelWechat: "微信",
            channelOther: "其他通道",
            actionApply: "申请发票",
            actionReapply: "重新申请",
            actionSubmitted: "待审核",
            actionDownload: "下载发票",
            actionEditInfo: "编辑资料",
            noRecords: "暂无可开票订单",
            tipsTitle: "开票说明",
            tipsWechat: "微信通道：提交申请后由财务审核，审核通过后可直接下载电子发票。",
            tipsOther: "其他通道：保存默认开票资料后，系统会按订单即时生成 PDF 发票。",
            profileDialogTitle: "编辑默认开票资料",
            wechatDialogTitle: "微信发票申请",
            companyPurchase: "企业采购",
            companyName: "公司名称",
            taxNo: "税号",
            countryRegion: "国家/地区",
            postalCode: "邮编",
            stateProvince: "州/省",
            city: "城市",
            address: "地址",
            save: "保存",
            saving: "保存中...",
            cancel: "取消",
            invoiceTitle: "发票抬头",
            invoiceTitlePlaceholder: "请输入发票抬头",
            invoiceKind: "发票类型",
            invoiceKindNormal: "普通发票",
            invoiceKindSpecial: "专用发票",
            invoiceItem: "开票项目",
            invoiceItemPlaceholder: "请输入开票项目",
            remark: "备注",
            remarkPlaceholder: "其他信息",
            invoiceNoticeTitle: "通知：",
            invoiceNoticeLine1: "请填写正确信息",
            invoiceNoticeLine2: "仅支持“技术服务”类发票",
            submit: "提交申请",
            submitting: "提交中...",
            generateAfterSave: "保存后将为当前订单直接生成发票。",
            profileSaved: "开票资料已保存",
            invoiceGenerated: "发票已生成",
            invoiceApplied: "发票申请已提交",
            openReview: "财务审核页",
            loginTitle: "请先登录",
            loginDesc: "登录后才能查看和管理发票。",
            enabled: "已开启",
            disabled: "未开启",
            yes: "是",
            no: "否",
            login: "登录",
            status: {
              not_applied: "未申请",
              submitted: "已提交",
              rejected: "已驳回",
              issued: "已开票",
              not_generated: "未生成",
              generated: "已生成",
            },
          }
        : {
            title: "Invoices",
            description: "Manage WeChat invoice applications, default invoice details, and invoice downloads in one place.",
            profileTitle: "Default Invoice Profile",
            profileDesc: "Non-WeChat channels generate PDF invoices from this profile.",
            editProfile: "Edit Invoice Info",
            profileHint: "WeChat orders are applied per order. Other channels use the saved default profile.",
            recordsTitle: "Invoice Orders",
            recordsDesc: "Review invoice status per order and complete the next action.",
            columnOrder: "Order No",
            columnChannel: "Channel",
            columnStatus: "Status",
            columnCreated: "Created",
            columnAction: "Action",
            channelWechat: "WeChat",
            channelOther: "Other",
            actionApply: "Apply",
            actionReapply: "Reapply",
            actionSubmitted: "Submitted",
            actionDownload: "Download",
            actionEditInfo: "Edit Info",
            noRecords: "No invoice-eligible orders found",
            tipsTitle: "Invoice Flow",
            tipsWechat: "WeChat: submit an invoice request, wait for finance review, then download the issued e-invoice.",
            tipsOther: "Other channels: save your default invoice profile and generate a PDF invoice on demand.",
            profileDialogTitle: "Edit Default Invoice Profile",
            wechatDialogTitle: "WeChat Invoice Application",
            companyPurchase: "Business purchase",
            companyName: "Company name",
            taxNo: "Tax no.",
            countryRegion: "Country / Region",
            postalCode: "Postal code",
            stateProvince: "State / Province",
            city: "City",
            address: "Address",
            save: "Save",
            saving: "Saving...",
            cancel: "Cancel",
            invoiceTitle: "Invoice title",
            invoiceTitlePlaceholder: "Enter invoice title",
            invoiceKind: "Invoice type",
            invoiceKindNormal: "Normal",
            invoiceKindSpecial: "Special",
            invoiceItem: "Invoice item",
            invoiceItemPlaceholder: "Enter invoice item",
            remark: "Remark",
            remarkPlaceholder: "Other details",
            invoiceNoticeTitle: "Notice:",
            invoiceNoticeLine1: "Please enter accurate invoice information.",
            invoiceNoticeLine2: "Only Technical Service invoices are supported.",
            submit: "Submit",
            submitting: "Submitting...",
            generateAfterSave: "Saving this profile will immediately generate the invoice for the selected order.",
            profileSaved: "Invoice profile saved",
            invoiceGenerated: "Invoice generated",
            invoiceApplied: "Invoice request submitted",
            openReview: "Finance Review",
            loginTitle: "Please log in",
            loginDesc: "You need to be logged in to manage invoices.",
            enabled: "Enabled",
            disabled: "Disabled",
            yes: "Yes",
            no: "No",
            login: "Login",
            status: {
              not_applied: "Not applied",
              submitted: "Submitted",
              rejected: "Rejected",
              issued: "Issued",
              not_generated: "Not generated",
              generated: "Generated",
            },
          },
    [isZh]
  );

  function getRecordChannelLabel(record: PaymentRecordData) {
    return record.document_kind === "invoice" ? text.channelWechat : text.channelOther;
  }

  function getRecordStatusLabel(record: PaymentRecordData) {
    if (record.document_kind === "invoice") {
      if (record.document_status === "not_ready") return text.status.not_applied;
      if (record.document_status === "pending") return text.status.submitted;
      if (record.document_status === "rejected") return text.status.rejected;
      if (record.document_status === "ready") return text.status.issued;
    } else {
      if (record.document_status === "not_ready") return text.status.not_generated;
      if (record.document_status === "ready") return text.status.generated;
    }

    return record.document_status || "-";
  }

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [profile, setProfile] = useState<InvoiceProfileData>(EMPTY_PROFILE);
  const [profileForm, setProfileForm] = useState<InvoiceProfileData>(EMPTY_PROFILE);
  const [records, setRecords] = useState<PaymentRecordData[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [wechatDialogOpen, setWechatDialogOpen] = useState(false);
  const [activeOrderNo, setActiveOrderNo] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoiceData | null>(null);
  const [wechatForm, setWechatForm] = useState<WechatInvoiceApplyRequest>(EMPTY_WECHAT_FORM);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingWechat, setSubmittingWechat] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  const handledQueryOrderRef = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!apiService.isLoggedInToApp(appConfig.appName)) {
          setIsLoggedIn(false);
          setShowLoginModal(true);
          return;
        }

        setIsLoggedIn(true);
        const profileResponse = await apiService.getInvoiceProfile();

        if (profileResponse.code === 200) {
          setProfile(profileResponse.data);
          setProfileForm(profileResponse.data);
        }
      } catch (error) {
        console.error("Failed to initialize invoice center:", error);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      void fetchRecords(currentPage);
    }
  }, [currentPage, isLoggedIn]);

  useEffect(() => {
    const orderNo = searchParams.get("order");
    if (!orderNo || handledQueryOrderRef.current || records.length === 0) {
      return;
    }

    const targetRecord = records.find((record) => record.order_no === orderNo);
    if (!targetRecord) {
      return;
    }

    handledQueryOrderRef.current = true;
    void handleInvoiceAction(targetRecord);
  }, [records, searchParams]);

  async function fetchRecords(page: number) {
    setRecordsLoading(true);
    try {
      const response = await apiService.getPaymentRecords({ page, page_size: pageSize });
      if (response.code === 200) {
        setRecords(response.data.records);
        setTotalRecords(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch invoice records:", error);
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setRecordsLoading(false);
    }
  }

  async function refreshProfile() {
    const response = await apiService.getInvoiceProfile();
    if (response.code === 200) {
      setProfile(response.data);
      setProfileForm(response.data);
    }
  }

  async function handleInvoiceAction(record: PaymentRecordData) {
    if (record.document_action === "download" && record.document_url) {
      window.open(record.document_url, "_blank", "noopener,noreferrer");
      return;
    }

    if (record.document_action === "submitted") {
      return;
    }

    if (record.document_action === "edit_info") {
      setActiveOrderNo(record.order_no);
      setProfileForm(profile);
      setProfileDialogOpen(true);
      return;
    }

    if (record.document_action === "apply" || record.document_action === "reapply") {
      try {
        const response = await apiService.getOrderInvoice(record.order_no);
        if (response.code === 200) {
          const detail = response.data;
          setSelectedInvoice(detail);
          setActiveOrderNo(record.order_no);
          setWechatForm({
            invoice_title: String(detail.snapshot?.invoice_title || ""),
            tax_no: String(detail.snapshot?.tax_no || ""),
            invoice_kind: "normal",
            invoice_item: String(detail.snapshot?.invoice_item || ""),
            remark: String(detail.snapshot?.remark || ""),
          });
          setWechatDialogOpen(true);
        }
      } catch (error) {
        toast.error(String(error instanceof Error ? error.message : error));
      }
    }
  }

  async function submitProfile() {
    if (profileForm.is_company && !profileForm.company_name?.trim()) {
      toast.error(`${text.companyName} ${isZh ? "不能为空" : "is required"}`);
      return;
    }

    if (profileForm.is_company && !profileForm.tax_no?.trim()) {
      toast.error(`${text.taxNo} ${isZh ? "不能为空" : "is required"}`);
      return;
    }

    if (!profileForm.country_region?.trim()) {
      toast.error(`${text.countryRegion} ${isZh ? "不能为空" : "is required"}`);
      return;
    }

    if (!profileForm.postal_code?.trim()) {
      toast.error(`${text.postalCode} ${isZh ? "不能为空" : "is required"}`);
      return;
    }

    setSavingProfile(true);
    try {
      const response = await apiService.updateInvoiceProfile(profileForm);
      if (response.code === 200) {
        setProfile(response.data);
        setProfileForm(response.data);
        toast.success(text.profileSaved);
      }

      if (activeOrderNo) {
        const generated = await apiService.generateOtherInvoice(activeOrderNo);
        if (generated.code === 200) {
          toast.success(text.invoiceGenerated);
          if (generated.data.invoice_url) {
            window.open(generated.data.invoice_url, "_blank", "noopener,noreferrer");
          }
        }
      }

      setProfileDialogOpen(false);
      setActiveOrderNo(null);
      await fetchRecords(currentPage);
      await refreshProfile();
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitWechatInvoice() {
    if (!activeOrderNo) {
      return;
    }

    setSubmittingWechat(true);
    try {
      const response = await apiService.applyWechatInvoice(activeOrderNo, wechatForm);
      if (response.code === 200) {
        setSelectedInvoice(response.data);
        toast.success(text.invoiceApplied);
        setWechatDialogOpen(false);
        await fetchRecords(currentPage);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSubmittingWechat(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <Card>
            <CardContent className="py-10">
              <div className="space-y-4 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">{text.loginTitle}</h1>
                <p className="text-muted-foreground">{text.loginDesc}</p>
                <Button onClick={() => setShowLoginModal(true)}>{text.login}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <LoginForm
          app_name={appConfig.appName}
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onLoginSuccess={() => {
            setShowLoginModal(false);
            window.location.reload();
          }}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-3xl font-semibold">
              <ReceiptText className="h-7 w-7 text-primary" />
              {text.title}
            </h1>
            <p className="text-sm text-muted-foreground">{text.description}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard/billing`}>{tBilling("title")}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">{text.profileTitle}</CardTitle>
                <CardDescription>{text.profileDesc}</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveOrderNo(null);
                  setProfileForm(profile);
                  setProfileDialogOpen(true);
                }}
              >
                {text.editProfile}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{text.companyPurchase}</p>
                <p className="font-medium">{profile.is_company ? text.yes : text.no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.companyName}</p>
                <p className="font-medium">{profile.company_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.taxNo}</p>
                <p className="font-medium">{profile.tax_no || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.countryRegion}</p>
                <p className="font-medium">{profile.country_region || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.city}</p>
                <p className="font-medium">{profile.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.address}</p>
                <p className="font-medium">{profile.address || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-xl">{text.tipsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <p>{text.tipsWechat}</p>
              </div>
              <div className="flex gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-sky-500" />
                <p>{text.tipsOther}</p>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                <p>{text.profileHint}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{text.recordsTitle}</CardTitle>
            <CardDescription>{text.recordsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading && records.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">{text.noRecords}</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{text.columnOrder}</TableHead>
                        <TableHead>{text.columnChannel}</TableHead>
                        <TableHead>{text.columnStatus}</TableHead>
                        <TableHead>{text.columnCreated}</TableHead>
                        <TableHead>{text.columnAction}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.order_no}>
                          <TableCell className="font-mono text-xs md:text-sm">{record.order_no}</TableCell>
                          <TableCell>
                            {getRecordChannelLabel(record)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.document_status === "ready"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {getRecordStatusLabel(record)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(record.created_time, locale)}
                          </TableCell>
                          <TableCell>
                            {record.document_action === "submitted" ? (
                              <Badge variant="outline">{text.actionSubmitted}</Badge>
                            ) : (
                              <Button
                                variant={record.document_action === "download" ? "outline" : "default"}
                                size="sm"
                                onClick={() => void handleInvoiceAction(record)}
                              >
                                {record.document_action === "download" && <FileDown className="mr-1 h-4 w-4" />}
                                {record.document_action === "apply" && text.actionApply}
                                {record.document_action === "reapply" && text.actionReapply}
                                {record.document_action === "download" && text.actionDownload}
                                {record.document_action === "edit_info" && text.actionEditInfo}
                                {!record.document_action && "-"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalRecords > pageSize && (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      {tBilling("pagination_showing", {
                        from: (currentPage - 1) * pageSize + 1,
                        to: Math.min(currentPage * pageSize, totalRecords),
                        total: totalRecords,
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || recordsLoading}
                      >
                        {tBilling("pagination_previous")}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {tBilling("pagination_page", {
                          current: currentPage,
                          total: Math.ceil(totalRecords / pageSize),
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(Math.ceil(totalRecords / pageSize), prev + 1))
                        }
                        disabled={currentPage >= Math.ceil(totalRecords / pageSize) || recordsLoading}
                      >
                        {tBilling("pagination_next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{text.profileDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border px-4 py-3">
              <p className="font-medium">{text.companyPurchase}</p>
              <Switch
                checked={profileForm.is_company}
                onCheckedChange={(checked) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    is_company: checked,
                    company_name: checked ? prev.company_name : "",
                    tax_no: checked ? prev.tax_no : "",
                  }))
                }
                aria-label={text.companyPurchase}
              />
            </div>
            {profileForm.is_company && (
              <>
                <div className="space-y-2">
                  <Label>
                    {text.companyName}
                    <RequiredMark />
                  </Label>
                  <Input
                    value={profileForm.company_name || ""}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, company_name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {text.taxNo}
                    <RequiredMark />
                  </Label>
                  <Input
                    value={profileForm.tax_no || ""}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, tax_no: event.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>
                {text.countryRegion}
                <RequiredMark />
              </Label>
              <Input
                value={profileForm.country_region || ""}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, country_region: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {text.postalCode}
                <RequiredMark />
              </Label>
              <Input
                value={profileForm.postal_code || ""}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{text.stateProvince}</Label>
              <Input
                value={profileForm.state_province || ""}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, state_province: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{text.city}</Label>
              <Input
                value={profileForm.city || ""}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{text.address}</Label>
              <Textarea
                value={profileForm.address || ""}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                className="min-h-[96px]"
              />
            </div>
            {activeOrderNo && (
              <p className="text-sm text-muted-foreground md:col-span-2">{text.generateAfterSave}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={() => void submitProfile()} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingProfile ? text.saving : text.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={wechatDialogOpen} onOpenChange={setWechatDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{text.wechatDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">{text.invoiceNoticeTitle}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{text.invoiceNoticeLine1}</li>
                <li>{text.invoiceNoticeLine2}</li>
              </ul>
            </div>
            {selectedInvoice?.reject_reason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {selectedInvoice.reject_reason}
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {text.invoiceTitle}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.invoice_title}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, invoice_title: event.target.value }))}
                placeholder={text.invoiceTitlePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {text.taxNo}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.tax_no}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, tax_no: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {text.invoiceKind}
                <RequiredMark />
              </Label>
              <RadioGroup
                value={wechatForm.invoice_kind}
                onValueChange={(value: "special" | "normal") =>
                  setWechatForm((prev) => ({ ...prev, invoice_kind: value }))
                }
                className="flex flex-wrap gap-5 pt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="normal"
                    id="invoice-kind-normal"
                    className="h-4 w-4 border-zinc-500 text-sky-400 data-[state=checked]:border-sky-400"
                  />
                  <Label
                    htmlFor="invoice-kind-normal"
                    className={`font-normal ${wechatForm.invoice_kind === "normal" ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {text.invoiceKindNormal}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>
                {text.invoiceItem}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.invoice_item}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, invoice_item: event.target.value }))}
                placeholder={text.invoiceItemPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{text.remark}</Label>
              <Textarea
                value={wechatForm.remark || ""}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, remark: event.target.value }))}
                className="min-h-[96px]"
                placeholder={text.remarkPlaceholder}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWechatDialogOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={() => void submitWechatInvoice()} disabled={submittingWechat}>
              {submittingWechat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submittingWechat ? text.submitting : text.submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

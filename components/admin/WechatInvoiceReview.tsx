"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AdminWechatInvoiceDetail,
  AdminWechatInvoiceListItem,
  apiService,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Eye, FileUp, Loader2, ShieldAlert, User } from "lucide-react";

const ADMIN_EMAIL = "goseasp@gmail.com";

type UserInfo = {
  email: string;
};

function isZhLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

function formatDate(value?: string | null, locale?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(locale || "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WechatInvoiceReview() {
  const locale = useLocale();
  const router = useRouter();
  const isZh = true;

  const text = useMemo(
    () =>
      isZh
        ? {
            title: "微信发票审核",
            description: "财务统一查看微信发票申请、驳回原因和电子发票上传状态。",
            back: "\u8fd4\u56de\u6e20\u9053 Key",
            loginTitle: "请先登录",
            loginDesc: "登录后才能访问财务审核页。",
            noAccessTitle: "无权访问",
            noAccessDesc: "当前账号不是财务管理员，不能打开微信发票审核页。",
            noAccessAction: "返回首页",
            filters: "筛选条件",
            status: "状态",
            all: "全部",
            orderNo: "订单号",
            uid: "UID",
            search: "查询",
            reset: "重置",
            listTitle: "申请列表",
            listDesc: "支持查看详情、驳回和上传电子发票。",
            noData: "暂无微信发票申请",
            view: "查看",
            reject: "驳回",
            issue: "上传发票",
            detailTitle: "申请详情",
            rejectTitle: "驳回申请",
            rejectReason: "驳回原因",
            rejectPlaceholder: "请输入驳回原因",
            uploadTitle: "上传电子发票",
            uploadHint: "仅支持 PDF 文件。",
            chooseFile: "选择 PDF",
            cancel: "取消",
            confirmReject: "确认驳回",
            confirmingReject: "驳回中...",
            confirmIssue: "确认上传",
            confirmingIssue: "上传中...",
            successReject: "已驳回发票申请",
            successIssue: "电子发票已上传",
            labels: {
              submitted: "已提交",
              rejected: "已驳回",
              issued: "已开票",
            },
            columns: {
              orderNo: "订单号",
              uid: "UID",
              status: "状态",
              created: "申请时间",
              issued: "开票时间",
              action: "操作",
            },
            snapshot: "申请快照",
            fileName: "文件名",
            fileUrl: "文件地址",
          }
        : {
            title: "WeChat Invoice Review",
            description: "Finance can review WeChat invoice applications, rejection reasons, and uploaded e-invoices here.",
            back: "Back to Channel Keys",
            loginTitle: "Please log in",
            loginDesc: "You need to be logged in to access the finance review page.",
            noAccessTitle: "Access denied",
            noAccessDesc: "This account is not allowed to access the WeChat invoice review page.",
            noAccessAction: "Go home",
            filters: "Filters",
            status: "Status",
            all: "All",
            orderNo: "Order No",
            uid: "UID",
            search: "Search",
            reset: "Reset",
            listTitle: "Application List",
            listDesc: "Review details, reject requests, or upload the final e-invoice.",
            noData: "No WeChat invoice applications yet",
            view: "View",
            reject: "Reject",
            issue: "Upload PDF",
            detailTitle: "Application Detail",
            rejectTitle: "Reject Request",
            rejectReason: "Reject reason",
            rejectPlaceholder: "Enter the rejection reason",
            uploadTitle: "Upload E-Invoice",
            uploadHint: "PDF only.",
            chooseFile: "Choose PDF",
            cancel: "Cancel",
            confirmReject: "Reject",
            confirmingReject: "Rejecting...",
            confirmIssue: "Upload",
            confirmingIssue: "Uploading...",
            successReject: "Invoice request rejected",
            successIssue: "E-invoice uploaded",
            labels: {
              submitted: "Submitted",
              rejected: "Rejected",
              issued: "Issued",
            },
            columns: {
              orderNo: "Order No",
              uid: "UID",
              status: "Status",
              created: "Created",
              issued: "Issued",
              action: "Action",
            },
            snapshot: "Snapshot",
            fileName: "File name",
            fileUrl: "File URL",
          },
    [isZh]
  );

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [items, setItems] = useState<AdminWechatInvoiceListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderNoFilter, setOrderNoFilter] = useState("");
  const [uidFilter, setUidFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<AdminWechatInvoiceDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [issueFile, setIssueFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!apiService.isLoggedInToApp(appConfig.appName)) {
          setIsLoggedIn(false);
          setShowLoginModal(true);
          return;
        }

        setIsLoggedIn(true);
        const response = await apiService.getUserInfo(appConfig.appName);
        if (response.code === 200) {
          const userInfo = response.data as UserInfo;
          setIsAdmin(userInfo.email === ADMIN_EMAIL);
        }
      } catch (error) {
        console.error("Failed to initialize invoice review:", error);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchList(currentPage);
    }
  }, [currentPage, isLoggedIn, isAdmin]);

  async function fetchList(
    page: number,
    filters?: { status?: string; orderNo?: string; uid?: string }
  ) {
    setListLoading(true);
    try {
      const currentStatus = filters?.status ?? statusFilter;
      const currentOrderNo = filters?.orderNo ?? orderNoFilter;
      const currentUid = filters?.uid ?? uidFilter;
      const response = await apiService.getAdminWechatInvoices({
        page,
        page_size: pageSize,
        status: currentStatus === "all" ? undefined : currentStatus,
        uid: currentUid ? Number(currentUid) : undefined,
        order_no: currentOrderNo || undefined,
      });

      if (response.code === 200) {
        setItems(response.data.items);
        setTotal(response.data.total);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setListLoading(false);
    }
  }

  async function openDetail(invoiceId: number) {
    try {
      const response = await apiService.getAdminWechatInvoiceDetail(invoiceId);
      if (response.code === 200) {
        setDetail(response.data);
        setDetailOpen(true);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    }
  }

  async function submitReject() {
    if (!detail) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.rejectAdminWechatInvoice(detail.id, rejectReason);
      if (response.code === 200) {
        setDetail(response.data);
        setRejectOpen(false);
        setRejectReason("");
        toast.success(text.successReject);
        await fetchList(currentPage);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitIssue() {
    if (!detail || !issueFile) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.issueAdminWechatInvoice(detail.id, issueFile);
      if (response.code === 200) {
        setDetail(response.data);
        setIssueOpen(false);
        setIssueFile(null);
        toast.success(text.successIssue);
        await fetchList(currentPage);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
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
                <Button onClick={() => setShowLoginModal(true)}>
                  {"登录"}
                </Button>
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

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Card>
          <CardContent className="py-10">
            <div className="space-y-4 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="text-2xl font-semibold">{text.noAccessTitle}</h1>
              <p className="text-muted-foreground">{text.noAccessDesc}</p>
              <Button variant="outline" onClick={() => router.push("/")}>
                {text.noAccessAction}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">{text.title}</h1>
          <p className="text-sm text-muted-foreground">{text.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{text.filters}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{text.status}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{text.all}</SelectItem>
                  <SelectItem value="submitted">{text.labels.submitted}</SelectItem>
                  <SelectItem value="rejected">{text.labels.rejected}</SelectItem>
                  <SelectItem value="issued">{text.labels.issued}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{text.orderNo}</Label>
              <Input value={orderNoFilter} onChange={(event) => setOrderNoFilter(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{text.uid}</Label>
              <Input value={uidFilter} onChange={(event) => setUidFilter(event.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => {
                  setCurrentPage(1);
                  void fetchList(1);
                }}
              >
                {text.search}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setOrderNoFilter("");
                  setUidFilter("");
                  setCurrentPage(1);
                  void fetchList(1, { status: "all", orderNo: "", uid: "" });
                }}
              >
                {text.reset}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.listTitle}</CardTitle>
            <CardDescription>{text.listDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading && items.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">{text.noData}</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{text.columns.orderNo}</TableHead>
                        <TableHead>{text.columns.uid}</TableHead>
                        <TableHead>{text.columns.status}</TableHead>
                        <TableHead>{text.columns.created}</TableHead>
                        <TableHead>{text.columns.issued}</TableHead>
                        <TableHead>{text.columns.action}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs md:text-sm">{item.order_no}</TableCell>
                          <TableCell>{item.uid}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "issued" ? "default" : "secondary"}>
                              {text.labels[item.status as keyof typeof text.labels] || item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.created_time, locale)}</TableCell>
                          <TableCell>{formatDate(item.issued_at, locale)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => void openDetail(item.id)}>
                                <Eye className="mr-1 h-4 w-4" />
                                {text.view}
                              </Button>
                              {item.status === "submitted" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      await openDetail(item.id);
                                      setRejectReason("");
                                      setRejectOpen(true);
                                    }}
                                  >
                                    {text.reject}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      await openDetail(item.id);
                                      setIssueFile(null);
                                      setIssueOpen(true);
                                    }}
                                  >
                                    <FileUp className="mr-1 h-4 w-4" />
                                    {text.issue}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {total > pageSize && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)} / ${total}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || listLoading}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
                        disabled={currentPage >= Math.ceil(total / pageSize) || listLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{text.detailTitle}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">{text.columns.orderNo}</p>
                  <p className="font-medium">{detail.order_no}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{text.columns.uid}</p>
                  <p className="font-medium">{detail.uid}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{text.columns.status}</p>
                  <p className="font-medium">{text.labels[detail.status as keyof typeof text.labels] || detail.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{text.fileName}</p>
                  <p className="font-medium">{detail.invoice_file_name || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">{text.fileUrl}</p>
                  <p className="break-all font-medium">{detail.invoice_file_url || "-"}</p>
                </div>
                {detail.reject_reason && (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">{text.rejectReason}</p>
                    <p className="font-medium text-destructive">{detail.reject_reason}</p>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-3 font-medium">{text.snapshot}</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(detail.snapshot || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{text.rejectTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{text.rejectReason}</Label>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={text.rejectPlaceholder}
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={() => void submitReject()} disabled={submitting || !rejectReason.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? text.confirmingReject : text.confirmReject}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{text.uploadTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{text.uploadHint}</p>
            <Input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setIssueFile(event.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              {text.cancel}
            </Button>
            <Button onClick={() => void submitIssue()} disabled={submitting || !issueFile}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? text.confirmingIssue : text.confirmIssue}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

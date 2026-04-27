'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { apiService, InvoiceProfileData, OrderInvoiceData, PaymentRecordData, WechatInvoiceApplyRequest } from '@/services/api';
import { appConfig } from '@/data/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Wallet, Bell, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import LoginForm from '@/components/auth/LoginForm';
import AutoRechargeSettings from '@/components/dashboard/AutoRechargeSettings';
import CreditAlertSettings from '@/components/dashboard/CreditAlertSettings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, QrCode, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Payment method type
type PaymentMethod = 'stripe' | 'alipay' | 'wxpay' | 'crypto_btc' | 'crypto_eth' | 'crypto_usdttrc20' | 'paypal';

// Crypto currency type
type CryptoCurrency = 'btc' | 'eth' | 'usdttrc20';

// QR Code payment data interface
interface QRCodePaymentData {
  order_no: string;
  pay_url?: string;
  qrcode?: string;
  qrcode_img?: string;
}

// Crypto payment data interface
interface CryptoPaymentData {
  order_no: string;
  payment_id: string;
  pay_address: string;
  pay_amount: string;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  payment_status: string;
}

// Bitcoin Icon Component
const BitcoinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.7-.167-1.053-.257l.527-2.127-1.313-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.974.225.954.238c.533.136.63.488.613.77l-.615 2.465c.038.01.087.025.14.048l-.14-.036-.864 3.456c-.065.165-.23.413-.6.31.014.02-.955-.238-.955-.238l-.652 1.514 1.716.428.94.236-.54 2.19 1.31.327.54-2.17c.36.1.705.19 1.05.273l-.538 2.156 1.315.328.54-2.182c2.24.424 3.924.253 4.635-1.774.57-1.637-.03-2.58-1.217-3.196.867-.2 1.52-.77 1.693-1.938z" />
  </svg>
);

// Ethereum Icon Component
const EthereumIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
  </svg>
);

// USDT Icon Component
const USDTIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0zm5.75 6.563h-2.531V9h2.531v2.531H8.25V9h2.531V6.563H8.25V4.031h9.5v2.531zm-8.656 5.875v-.75h2.437v.75c0 2.063.094 2.063 2.469 2.063 2.344 0 2.438 0 2.438-2.063v-.75h2.437v.75c0 3.656-.875 4.5-4.875 4.5s-4.906-.844-4.906-4.5z" />
  </svg>
);

// Alipay Icon Component
const AlipayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M21.422 15.358c-3.32-1.297-6.17-2.893-6.17-2.893s.861-2.143 1.21-4.357H11.55v-1.51h5.624V5.313h-5.624V3h-2.183v2.313H3.822v1.285h5.545v1.51H4.45v1.284h9.74c-.246 1.088-.615 2.19-1.107 3.18 0 0-3.018-1.046-6.105-.423-2.545.514-4.283 2.545-4.196 4.932.088 2.386 2.053 4.196 4.932 4.196 3.48 0 5.97-2.317 7.448-4.696 2.473 1.088 7.177 2.893 7.177 2.893l.008.014c.615-.164 1.23-.41 1.804-.738-.053-.123-.422-.774-2.728-1.405z" />
  </svg>
);

// PayPal Icon Component
const PayPalIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
  </svg>
);

// WeChat Pay Icon Component
const WeChatPayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088-.146-.01-.29-.023-.437-.034h.03zm-2.592 3.04c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.827 0c.536 0 .97.44.97.982a.976.976 0 0 1-.97.983.976.976 0 0 1-.969-.983c0-.542.433-.982.97-.982z" />
  </svg>
);

interface PricingPlan {
  name: string;
  code: string;
  credits: number;
  price: number;
  popular?: boolean;
  savePercent?: number;
}

const EMPTY_WECHAT_FORM: WechatInvoiceApplyRequest = {
  invoice_title: '',
  tax_no: '',
  invoice_kind: 'normal',
  invoice_item: '',
  remark: '',
};

const EMPTY_PROFILE: InvoiceProfileData = {
  is_company: false,
  company_name: '',
  tax_no: '',
  country_region: '',
  postal_code: '',
  state_province: '',
  city: '',
  address: '',
};

function RequiredMark() {
  return <span className="ml-1 font-semibold text-red-500">*</span>;
}

export default function DashboardBillingPage() {
  const router = useRouter();
  const locale = useLocale();
  const isZh = locale.toLowerCase().startsWith('zh');
  const t = useTranslations('Dashboard.Billing');
  const shellT = useTranslations('DashboardShell');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecordData[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodePaymentData | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoPaymentData, setCryptoPaymentData] = useState<CryptoPaymentData | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('btc');
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [showCreditAlertDialog, setShowCreditAlertDialog] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [wechatDialogOpen, setWechatDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoiceData | null>(null);
  const [activeInvoiceOrderNo, setActiveInvoiceOrderNo] = useState<string | null>(null);
  const [wechatForm, setWechatForm] = useState<WechatInvoiceApplyRequest>(EMPTY_WECHAT_FORM);
  const [submittingWechatInvoice, setSubmittingWechatInvoice] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<InvoiceProfileData>(EMPTY_PROFILE);
  const [activeReceiptOrderNo, setActiveReceiptOrderNo] = useState<string | null>(null);
  const [savingReceiptProfile, setSavingReceiptProfile] = useState(false);
  const pageSize = 10;
  const invoiceCenterLabel = isZh ? '发票中心' : 'Invoices';
  const invoiceActionMap: Record<string, string> = {
    apply: isZh ? '申请发票' : 'Apply',
    reapply: isZh ? '重新申请' : 'Reapply',
    edit_info: isZh ? '编辑资料' : 'Edit Info',
    download: isZh ? '下载发票' : 'Download',
    submitted: isZh ? '待审核' : 'Submitted',
  };

  const wechatInvoiceText = {
    dialogTitle: isZh ? '发票信息' : 'WeChat Invoice Application',
    noticeTitle: isZh ? '通知：' : 'Notice:',
    noticeLine1: isZh ? '请填写正确信息' : 'Please enter accurate invoice information.',
    noticeLine2: isZh ? '仅支持“技术服务”类发票' : 'Only Technical Service invoices are supported.',
    invoiceTitle: isZh ? '发票抬头' : 'Invoice title',
    invoiceTitlePlaceholder: isZh ? '请输入发票抬头' : 'Enter invoice title',
    taxNo: isZh ? '税号' : 'Tax no.',
    taxNoPlaceholder: isZh ? '请输入税号' : 'Enter tax number',
    invoiceKind: isZh ? '发票类型' : 'Invoice type',
    invoiceKindSpecial: isZh ? '增值税专用发票' : 'Special',
    invoiceKindNormal: isZh ? '普通发票' : 'Normal',
    invoiceItem: isZh ? '开票项目' : 'Invoice item',
    invoiceItemPlaceholder: isZh ? '请输入开票项目' : 'Enter invoice item',
    remark: isZh ? '发票信息' : 'Remark',
    remarkPlaceholder: isZh ? '其他信息' : 'Other details',
    cancel: isZh ? '取消' : 'Cancel',
    submit: isZh ? '提交申请' : 'Submit',
    submitting: isZh ? '提交中...' : 'Submitting...',
    success: isZh ? '发票申请已提交' : 'Invoice request submitted',
  };
  const receiptProfileText = {
    dialogTitle: isZh ? '编辑发票信息' : 'Edit Invoice Info',
    companyPurchase: isZh ? '企业采购' : 'Business purchase',
    companyName: isZh ? '公司名称' : 'Company name',
    taxNo: isZh ? '税号' : 'Tax no.',
    countryRegion: isZh ? '国家或地区' : 'Country / Region',
    postalCode: isZh ? '邮政编码' : 'Postal code',
    stateProvince: isZh ? '州/省' : 'State / Province',
    city: isZh ? '城市' : 'City',
    address: isZh ? '地址' : 'Address',
    generateAfterSave: isZh ? '保存后将立即生成当前订单收据。' : 'Saving will immediately generate the receipt for this order.',
    cancel: isZh ? '取消' : 'Cancel',
    save: isZh ? '保存收据' : 'Save',
    saving: isZh ? '保存中...' : 'Saving...',
    saved: isZh ? '发票信息已保存' : 'Invoice info saved',
    generated: isZh ? '收据已生成' : 'Receipt generated',
  };

  const getReceiptActionLabel = (record: PaymentRecordData) => {
    if (record.document_action === 'download' && record.document_kind === 'receipt') {
      return t('download_receipt');
    }

    if (record.document_action) {
      return invoiceActionMap[record.document_action] || invoiceCenterLabel;
    }

    return t('download_receipt');
  };

  // Pricing plans data - 4 fixed plans
  const pricingPlans: PricingPlan[] = [
    { name: '1,000 Credits', code: '11000001', credits: 1000, price: 5 },
    { name: '10,000 Credits', code: '11000003', credits: 10000, price: 50 },
    { name: '105,000 Credits', code: '11000004', credits: 105000, price: 500, savePercent: 5 },
    { name: '275,000 Credits', code: '11000005', credits: 275000, price: 1250, savePercent: 10 },
  ];

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!apiService.isLoggedInToApp(appConfig.appName)) {
          setIsLoggedIn(false);
          setLoading(false);
          setShowLoginModal(true);
          return;
        }

        setIsLoggedIn(true);

        // Fetch user info
        const response = await apiService.getUserInfo(appConfig.appName);
        if (response.code === 200) {
          setUserInfo(response.data);
        }

      } catch (error: any) {
        console.error('Failed to initialize:', error);
        // Just log the error, don't show error UI
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch payment records when page changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchPaymentRecords(currentPage);
    }
  }, [currentPage, isLoggedIn]);

  const fetchPaymentRecords = async (page: number) => {
    setPaymentLoading(true);
    try {
      const response = await apiService.getPaymentRecords({
        page,
        page_size: pageSize,
      });

      if (response.code === 200) {
        setPaymentRecords(response.data.records);
        setTotalRecords(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch payment records:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const openWechatInvoiceDialog = async (record: PaymentRecordData) => {
    try {
      const response = await apiService.getOrderInvoice(record.order_no);
      if (response.code === 200) {
        const detail = response.data;
        setSelectedInvoice(detail);
        setActiveInvoiceOrderNo(record.order_no);
        setWechatForm({
          invoice_title: String(detail.snapshot?.invoice_title || ''),
          tax_no: String(detail.snapshot?.tax_no || ''),
          invoice_kind: 'normal',
          invoice_item: String(detail.snapshot?.invoice_item || ''),
          remark: String(detail.snapshot?.remark || ''),
        });
        setWechatDialogOpen(true);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    }
  };

  const openOtherInvoiceDialog = async (record: PaymentRecordData) => {
    try {
      const response = await apiService.getInvoiceProfile();
      if (response.code === 200) {
        setProfileForm(response.data || EMPTY_PROFILE);
      } else {
        setProfileForm(EMPTY_PROFILE);
      }
    } catch {
      setProfileForm(EMPTY_PROFILE);
    }

    setActiveReceiptOrderNo(record.order_no);
    setProfileDialogOpen(true);
  };

  const submitOtherInvoiceProfile = async () => {
    if (!activeReceiptOrderNo) {
      return;
    }

    if (profileForm.is_company && !profileForm.company_name?.trim()) {
      toast.error(`${receiptProfileText.companyName} ${isZh ? '不能为空' : 'is required'}`);
      return;
    }

    if (profileForm.is_company && !profileForm.tax_no?.trim()) {
      toast.error(`${receiptProfileText.taxNo} ${isZh ? '不能为空' : 'is required'}`);
      return;
    }

    if (!profileForm.country_region?.trim()) {
      toast.error(`${receiptProfileText.countryRegion} ${isZh ? '不能为空' : 'is required'}`);
      return;
    }

    if (!profileForm.postal_code?.trim()) {
      toast.error(`${receiptProfileText.postalCode} ${isZh ? '不能为空' : 'is required'}`);
      return;
    }

    setSavingReceiptProfile(true);
    try {
      const response = await apiService.generateOtherInvoice(activeReceiptOrderNo, profileForm);
      if (response.code === 200) {
        toast.success(receiptProfileText.generated);
        setProfileDialogOpen(false);
        setActiveReceiptOrderNo(null);
        if (response.data.invoice_url) {
          window.open(response.data.invoice_url, '_blank', 'noopener,noreferrer');
        }
        await fetchPaymentRecords(currentPage);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSavingReceiptProfile(false);
    }
  };

  const submitWechatInvoice = async () => {
    if (!activeInvoiceOrderNo) {
      return;
    }

    setSubmittingWechatInvoice(true);
    try {
      const response = await apiService.applyWechatInvoice(activeInvoiceOrderNo, wechatForm);
      if (response.code === 200) {
        setSelectedInvoice(response.data);
        toast.success(wechatInvoiceText.success);
        setWechatDialogOpen(false);
        await fetchPaymentRecords(currentPage);
      }
    } catch (error) {
      toast.error(String(error instanceof Error ? error.message : error));
    } finally {
      setSubmittingWechatInvoice(false);
    }
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
  };

  // Start polling for payment status
  const startPaymentPolling = (orderNo: string, payWindow?: Window | null) => {
    // Capture selectedPlan at the time polling starts (before state may be cleared)
    const planSnapshot = selectedPlan;
    let paymentHandled = false;

    // Clear existing polling if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      // Prevent duplicate handling from concurrent polling callbacks
      if (paymentHandled) return;

      // For Stripe, check if window is closed
      if (payWindow && payWindow.closed) {
        clearInterval(interval);
        setPollingInterval(null);
        setPurchaseLoading(false);
        return;
      }

      try {
        const statusResult = await apiService.checkPaymentStatus(orderNo, appConfig.appName);

        if (statusResult.code === 200 && statusResult.data.status === 'completed') {
          paymentHandled = true;
          clearInterval(interval);
          setPollingInterval(null);
          payWindow?.close();

          toast.success('Payment successful!');
          setPurchaseLoading(false);
          setSelectedPlan(null);
          setShowQRCodeModal(false);
          setQRCodeData(null);

          // Refresh user info
          const userResponse = await apiService.getUserInfo(appConfig.appName);
          if (userResponse.code === 200) {
            setUserInfo(userResponse.data);
          }

          // Refresh payment records
          await fetchPaymentRecords(currentPage);
        }
      } catch (error) {
        console.error('Check payment status error:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // Stop polling when QR modal is closed
  const handleCloseQRModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setShowQRCodeModal(false);
    setQRCodeData(null);
    setPurchaseLoading(false);
  };

  // Open crypto payment modal
  const handleOpenCryptoModal = () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    setShowCryptoModal(true);
    setCryptoPaymentData(null);
    setSelectedCrypto('btc');
    setAddressCopied(false);
  };

  // Close crypto payment modal
  const handleCloseCryptoModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setShowCryptoModal(false);
    setCryptoPaymentData(null);
    setCryptoLoading(false);
    setAddressCopied(false);
  };

  // Handle crypto currency selection and create payment
  const handleCryptoPayment = async (crypto: CryptoCurrency) => {
    if (!selectedPlan) return;

    setSelectedCrypto(crypto);
    setCryptoLoading(true);
    setCryptoPaymentData(null);

    try {
      const result = await apiService.createCheckoutSession(
        {
          plan_code: selectedPlan.code,
          frontend_url: window.location.href,
          payment_method: `crypto_${crypto}` as PaymentMethod,
        },
        appConfig.appName
      );

      if (result.code === 200 && result.data) {
        setCryptoPaymentData({
          order_no: result.data.order_no,
          payment_id: result.data.payment_id,
          pay_address: result.data.pay_address,
          pay_amount: result.data.pay_amount,
          pay_currency: result.data.pay_currency,
          price_amount: result.data.price_amount,
          price_currency: result.data.price_currency,
          payment_status: result.data.payment_status,
        });
        startPaymentPolling(result.data.order_no);
      } else {
        throw new Error(result.message || 'Failed to create crypto payment');
      }
    } catch (error) {
      console.error('Crypto payment error:', error);
      toast.error('Failed to create crypto payment');
    } finally {
      setCryptoLoading(false);
    }
  };

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAddressCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    setPurchaseLoading(true);

    try {
      // Call the payment API using apiService with payment_method
      const result = await apiService.createCheckoutSession(
        {
          plan_code: selectedPlan.code,
          frontend_url: window.location.href,
          payment_method: paymentMethod,
        },
        appConfig.appName
      );

      if (result.code === 200) {
        const { order_no } = result.data;

        if (paymentMethod === 'stripe') {
          // Stripe: open payment page in new window
          if (result.data?.url) {
            const payWindow = window.open(result.data.url, '_blank');
            startPaymentPolling(order_no, payWindow);
          } else {
            throw new Error('No payment URL returned');
          }
        } else {
          // Alipay/WeChat: show QR code modal or redirect
          if (result.data.qrcode_img || result.data.qrcode) {
            setQRCodeData({
              order_no,
              qrcode_img: result.data.qrcode_img,
              qrcode: result.data.qrcode,
              pay_url: result.data.pay_url,
            });
            setShowQRCodeModal(true);
            startPaymentPolling(order_no);
          } else if (result.data.pay_url) {
            // Fallback: open pay_url in new window
            const payWindow = window.open(result.data.pay_url, '_blank');
            startPaymentPolling(order_no, payWindow);
          } else {
            throw new Error('No QR code or payment URL returned');
          }
        }
      } else {
        throw new Error(result.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Payment failed');
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <Skeleton className="h-5 w-80 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-48 rounded-[28px]" />
            <Skeleton className="h-80 rounded-[28px]" />
            <Skeleton className="h-80 rounded-[28px]" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {shellT('groups.account')}
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
            </div>
            <Card className="rounded-[28px] border-border/70 shadow-sm">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">{t('please_login')}</h3>
                  <p className="text-muted-foreground">{t('login_required')}</p>
                  <Button onClick={() => setShowLoginModal(true)} className="h-11 rounded-xl px-5">
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {shellT('groups.account')}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{t('title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('pricing_plans_subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Current Balance & FAQ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Credits Card */}
            <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t('current_credits')}</CardTitle>
                  <Bell className="h-4 w-4 ml-auto text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => setShowCreditAlertDialog(true)} />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {loading ? (
                    <Skeleton className="h-12 w-32" />
                  ) : (
                    <p className="text-4xl font-bold">{userInfo?.credits_amount ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('credits_label')}</p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
                <CardTitle className="text-base">{t('faq')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">
                      {t('faq_q1')}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {t('faq_a1')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">
                      {t('faq_q2')}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {t('faq_a2')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">
                      {t('faq_q3')}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {t('faq_a3')}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Auto Recharge Settings - temporarily disabled */}
            <AutoRechargeSettings
              onConfigUpdate={async () => {
                // Refresh user info when auto recharge config is updated
                const response = await apiService.getUserInfo(appConfig.appName);
                if (response.code === 200) {
                  setUserInfo(response.data);
                }
              }}
            />
          </div>

          {/* Right Content - Pricing Plans */}
          <div className="space-y-6 lg:col-span-3">
            <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
                <CardTitle className="text-2xl">{t('pricing_plans')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('pricing_plans_subtitle')}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pricingPlans
                    .filter(plan => !(paymentMethod.startsWith('crypto_') && plan.code === '11000001'))
                    .map((plan) => (
                      <Card
                        key={plan.code}
                        className={`relative transition-all hover:shadow-lg cursor-pointer overflow-hidden ${selectedPlan?.code === plan.code ? 'border-primary ring-2 ring-primary' : ''
                          }`}
                        onClick={() => !purchaseLoading && handleSelectPlan(plan)}
                      >
                        {plan.savePercent && (
                          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                            <div className="absolute top-4 -right-7 w-32 bg-blue-500 text-white text-center text-xs font-semibold py-1 rotate-45 shadow-md">
                              {plan.savePercent}% {t('save')}
                            </div>
                          </div>
                        )}
                        <CardContent className="pt-6 pb-4 space-y-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold">${plan.price}</p>
                          </div>

                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              {plan.credits.toLocaleString()} {t('credits_label')}
                            </p>
                          </div>

                          {selectedPlan?.code === plan.code && (
                            <div className="flex items-center justify-center">
                              <Badge variant="default" className="bg-primary">
                                <Check className="h-3 w-3 mr-1" />
                                {t('selected')}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Payment Method Selection */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">{t('payment_method')}</h3>

                  {/* Payment Method Tabs */}
                  <Tabs
                    value={paymentMethod}
                    onValueChange={(v) => {
                      const newMethod = v as PaymentMethod;
                      setPaymentMethod(newMethod);
                      if (newMethod.startsWith('crypto_') && selectedPlan?.code === '11000001') {
                        setSelectedPlan(null);
                      }
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                      <TabsTrigger value="stripe" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('payment_method_stripe')}</span>
                        <span className="sm:hidden">Card</span>
                      </TabsTrigger>
                      <TabsTrigger value="paypal" className="flex items-center gap-2">
                        <PayPalIcon />
                        <span className="hidden sm:inline">{t('payment_method_paypal')}</span>
                        <span className="sm:hidden">PayPal</span>
                      </TabsTrigger>
                      {/* Alipay - Commented out per requirements
                      <TabsTrigger value="alipay" className="flex items-center gap-2">
                        <AlipayIcon />
                        <span className="hidden sm:inline">{t('payment_method_alipay')}</span>
                        <span className="sm:hidden">Alipay</span>
                      </TabsTrigger>
                      */}
                      <TabsTrigger value="wxpay" className="flex items-center gap-2">
                        <WeChatPayIcon />
                        <span className="hidden sm:inline">{t('payment_method_wxpay')}</span>
                        <span className="sm:hidden">WeChat</span>
                      </TabsTrigger>
                      <TabsTrigger value="crypto_btc" className="flex items-center gap-2">
                        <BitcoinIcon />
                        <span className="hidden sm:inline">{t('payment_method_crypto')}</span>
                        <span className="sm:hidden">Crypto</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Pay Button - for Stripe */}
                  {paymentMethod === 'stripe' && (
                    <Button
                      onClick={handlePayment}
                      disabled={!selectedPlan || purchaseLoading}
                      className="w-full font-semibold py-6 text-lg bg-[#635BFF] hover:bg-[#5851DF] text-white"
                    >
                      {purchaseLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('processing')}</>
                      ) : selectedPlan ? (
                        <>{t('pay_now')} ${selectedPlan.price}</>
                      ) : (
                        <>{t('select_plan_to_continue')}</>
                      )}
                    </Button>
                  )}

                  {/* Pay Button - for PayPal (Static - Coming Soon) */}
                  {paymentMethod === 'paypal' && (
                    <>
                      <Button
                        disabled={true}
                        className="w-full font-semibold py-6 text-lg bg-[#0070BA] text-white disabled:opacity-60"
                      >
                        <PayPalIcon />
                        <span className="ml-2">
                          {selectedPlan ? `${t('pay_now')} $${selectedPlan.price}` : t('select_plan_to_continue')}
                        </span>
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Coming Soon
                      </p>
                    </>
                  )}

                  {/* Pay Button - for Alipay (Commented out per requirements)
                  {paymentMethod === 'alipay' && (
                    <>
                      <Button
                        disabled={true}
                        className="w-full font-semibold py-6 text-lg bg-[#1677FF] text-white disabled:opacity-50"
                      >
                        {selectedPlan ? (
                          <>{t('pay_now')} ${selectedPlan.price}</>
                        ) : (
                          <>{t('select_plan_to_continue')}</>
                        )}
                      </Button>
                      <p className="text-xs text-destructive text-center mt-2">
                        Coming Soon
                      </p>
                    </>
                  )}
                  */}

                  {/* Pay Button - for WeChat Pay */}
                  {paymentMethod === 'wxpay' && (
                    <Button
                      onClick={handlePayment}
                      disabled={!selectedPlan || purchaseLoading}
                      className="w-full font-semibold py-6 text-lg bg-[#07C160] hover:bg-[#06AD51] text-white"
                    >
                      {purchaseLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('processing')}</>
                      ) : selectedPlan ? (
                        <>{t('pay_now')} ${selectedPlan.price}</>
                      ) : (
                        <>{t('select_plan_to_continue')}</>
                      )}
                    </Button>
                  )}

                  {/* Pay Button - for Crypto */}
                  {paymentMethod === 'crypto_btc' && (
                    <>
                      <Button
                        onClick={handleOpenCryptoModal}
                        disabled={!selectedPlan || purchaseLoading}
                        className="w-full font-semibold py-6 text-lg bg-gradient-to-r from-[#F7931A] via-[#627EEA] to-[#26A17B] hover:opacity-90 text-white disabled:opacity-50"
                      >
                        {selectedPlan ? (
                          <>{t('pay_now')} ${selectedPlan.price}</>
                        ) : (
                          <>{t('select_plan_to_continue')}</>
                        )}
                      </Button>
                    </>
                  )}

                  {paymentMethod !== 'paypal' && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {paymentMethod === 'crypto_btc'
                        ? `${t('crypto_supported')}: BTC, ETH, USDT`
                        : t('secure_payment_note')
                      }
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History Section */}
            <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60 bg-muted/20 px-6 py-5">
                <div>
                  <CardTitle className="text-2xl">{t('transaction_history_title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('transaction_history_description')}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {paymentLoading && paymentRecords.length === 0 ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : paymentRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>{t('no_transactions')}</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('table_order_no')}</TableHead>
                            <TableHead>{t('table_plan_name')}</TableHead>
                            <TableHead>{t('table_amount')}</TableHead>
                            <TableHead>{t('table_status')}</TableHead>
                            <TableHead>{t('table_created_time')}</TableHead>
                            <TableHead>{t('table_receipt')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentRecords.map((record) => (
                            <TableRow key={record.order_no}>
                              <TableCell className="font-mono text-sm">
                                {record.order_no}
                              </TableCell>
                              <TableCell>{record.plan_name}</TableCell>
                              <TableCell className="font-semibold">
                                ${record.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {record.status}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(record.created_time).toLocaleString(locale, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                {record.document_action === 'submitted' ? (
                                  <Badge variant="outline">{invoiceActionMap.submitted}</Badge>
                                ) : record.document_action === 'download' && record.document_url ? (
                                  <Button asChild variant="outline" size="sm">
                                    <a
                                      href={record.document_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {getReceiptActionLabel(record)}
                                    </a>
                                  </Button>
                                ) : record.document_kind === 'invoice' && (
                                  record.document_action === 'apply' || record.document_action === 'reapply'
                                ) ? (
                                  <Button size="sm" onClick={() => void openWechatInvoiceDialog(record)}>
                                    {getReceiptActionLabel(record)}
                                  </Button>
                                ) : record.document_action === 'edit_info' ? (
                                  <Button size="sm" onClick={() => void openOtherInvoiceDialog(record)}>
                                    {getReceiptActionLabel(record)}
                                  </Button>
                                ) : record.document_action ? (
                                  <Button size="sm" disabled>
                                    {getReceiptActionLabel(record)}
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalRecords > pageSize && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          {t('pagination_showing', {
                            from: (currentPage - 1) * pageSize + 1,
                            to: Math.min(currentPage * pageSize, totalRecords),
                            total: totalRecords
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || paymentLoading}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('pagination_previous')}
                          </Button>
                          <div className="text-sm">
                            {t('pagination_page', {
                              current: currentPage,
                              total: Math.ceil(totalRecords / pageSize)
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalRecords / pageSize), prev + 1))}
                            disabled={currentPage >= Math.ceil(totalRecords / pageSize) || paymentLoading}
                          >
                            {t('pagination_next')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{receiptProfileText.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border px-4 py-3">
              <p className="font-medium">{receiptProfileText.companyPurchase}</p>
              <Switch
                checked={profileForm.is_company}
                onCheckedChange={(checked) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    is_company: checked,
                    company_name: checked ? prev.company_name : '',
                    tax_no: checked ? prev.tax_no : '',
                  }))
                }
                aria-label={receiptProfileText.companyPurchase}
              />
            </div>
            {profileForm.is_company && (
              <>
                <div className="space-y-2">
                  <Label>
                    {receiptProfileText.companyName}
                    <RequiredMark />
                  </Label>
                  <Input
                    value={profileForm.company_name || ''}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, company_name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {receiptProfileText.taxNo}
                    <RequiredMark />
                  </Label>
                  <Input
                    value={profileForm.tax_no || ''}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, tax_no: event.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>
                {receiptProfileText.countryRegion}
                <RequiredMark />
              </Label>
              <Input
                value={profileForm.country_region || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, country_region: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {receiptProfileText.postalCode}
                <RequiredMark />
              </Label>
              <Input
                value={profileForm.postal_code || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, postal_code: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{receiptProfileText.stateProvince}</Label>
              <Input
                value={profileForm.state_province || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, state_province: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{receiptProfileText.city}</Label>
              <Input
                value={profileForm.city || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{receiptProfileText.address}</Label>
              <Textarea
                value={profileForm.address || ''}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                className="min-h-[96px]"
              />
            </div>
            {activeReceiptOrderNo && (
              <p className="text-sm text-muted-foreground md:col-span-2">
                {receiptProfileText.generateAfterSave}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              {receiptProfileText.cancel}
            </Button>
            <Button onClick={() => void submitOtherInvoiceProfile()} disabled={savingReceiptProfile}>
              {savingReceiptProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingReceiptProfile ? receiptProfileText.saving : receiptProfileText.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={wechatDialogOpen} onOpenChange={setWechatDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{wechatInvoiceText.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">{wechatInvoiceText.noticeTitle}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{wechatInvoiceText.noticeLine1}</li>
                <li>{wechatInvoiceText.noticeLine2}</li>
              </ul>
            </div>
            {selectedInvoice?.reject_reason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {selectedInvoice.reject_reason}
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {wechatInvoiceText.invoiceTitle}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.invoice_title}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, invoice_title: event.target.value }))}
                placeholder={wechatInvoiceText.invoiceTitlePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {wechatInvoiceText.taxNo}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.tax_no}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, tax_no: event.target.value }))}
                placeholder={wechatInvoiceText.taxNoPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {wechatInvoiceText.invoiceKind}
                <RequiredMark />
              </Label>
              <RadioGroup
                value={wechatForm.invoice_kind}
                onValueChange={(value: 'special' | 'normal') =>
                  setWechatForm((prev) => ({ ...prev, invoice_kind: value }))
                }
                className="flex flex-wrap gap-5 pt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="normal"
                    id="billing-invoice-kind-normal"
                    className="h-4 w-4 border-zinc-500 text-sky-400 data-[state=checked]:border-sky-400"
                  />
                  <Label
                    htmlFor="billing-invoice-kind-normal"
                    className={`font-normal ${wechatForm.invoice_kind === 'normal' ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {wechatInvoiceText.invoiceKindNormal}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>
                {wechatInvoiceText.invoiceItem}
                <RequiredMark />
              </Label>
              <Input
                value={wechatForm.invoice_item}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, invoice_item: event.target.value }))}
                placeholder={wechatInvoiceText.invoiceItemPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{wechatInvoiceText.remark}</Label>
              <Textarea
                value={wechatForm.remark || ''}
                onChange={(event) => setWechatForm((prev) => ({ ...prev, remark: event.target.value }))}
                className="min-h-[96px]"
                placeholder={wechatInvoiceText.remarkPlaceholder}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWechatDialogOpen(false)}>
              {wechatInvoiceText.cancel}
            </Button>
            <Button onClick={() => void submitWechatInvoice()} disabled={submittingWechatInvoice}>
              {submittingWechatInvoice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submittingWechatInvoice ? wechatInvoiceText.submitting : wechatInvoiceText.submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp QR Code Dialog */}
      <Dialog open={showQRCodeModal} onOpenChange={handleCloseQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('scan_to_pay')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {/* Payment Amount */}
            {selectedPlan && (
              <div className="text-center">
                <p className="text-3xl font-bold">${selectedPlan.price}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.credits.toLocaleString()} {t('credits_label')}
                </p>
              </div>
            )}

            {/* QR Code Image */}
            {qrCodeData && (
              <div className="bg-white p-4 rounded-lg">
                {qrCodeData.qrcode_img ? (
                  <img
                    src={qrCodeData.qrcode_img}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : qrCodeData.qrcode ? (
                  <img
                    src={qrCodeData.qrcode}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : null}
              </div>
            )}

            {/* Waiting Message */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('waiting_for_payment')}</span>
            </div>

            {/* Payment Method Icon */}
            <div className="flex items-center gap-2">
              {paymentMethod === 'alipay' ? (
                <span className="flex items-center gap-1 text-[#1677FF]">
                  <AlipayIcon /> Alipay
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#07C160]">
                  <WeChatPayIcon /> WeChat Pay
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crypto Payment Dialog */}
      <Dialog open={showCryptoModal} onOpenChange={handleCloseCryptoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BitcoinIcon />
              {t('payment_method_crypto')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4 p-2">
            {/* Crypto Selection */}
            {!cryptoPaymentData && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {t('select_crypto')}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedCrypto === 'btc' ? 'default' : 'outline'}
                    onClick={() => handleCryptoPayment('btc')}
                    disabled={cryptoLoading}
                    className="flex flex-col items-center gap-1 h-auto py-4"
                  >
                    <span className="text-[#F7931A]"><BitcoinIcon /></span>
                    <span className="text-xs">BTC</span>
                  </Button>
                  <Button
                    variant={selectedCrypto === 'eth' ? 'default' : 'outline'}
                    onClick={() => handleCryptoPayment('eth')}
                    disabled={cryptoLoading}
                    className="flex flex-col items-center gap-1 h-auto py-4"
                  >
                    <span className="text-[#627EEA]"><EthereumIcon /></span>
                    <span className="text-xs">ETH</span>
                  </Button>
                  <Button
                    variant={selectedCrypto === 'usdttrc20' ? 'default' : 'outline'}
                    onClick={() => handleCryptoPayment('usdttrc20')}
                    disabled={cryptoLoading}
                    className="flex flex-col items-center gap-1 h-auto py-4"
                  >
                    <span className="text-[#26A17B]"><USDTIcon /></span>
                    <span className="text-xs">USDT</span>
                  </Button>
                </div>
                {cryptoLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </>
            )}

            {/* Payment Info */}
            {cryptoPaymentData && (
              <div className="flex flex-col items-center space-y-4">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={cryptoPaymentData.pay_address}
                    size={180}
                    level="H"
                  />
                </div>

                {/* Payment Amount */}
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {cryptoPaymentData.pay_amount} {cryptoPaymentData.pay_currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('equivalent_to')} ${cryptoPaymentData.price_amount} USD
                  </p>
                </div>

                {/* Payment Address */}
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-1">{t('pay_address')}</p>
                  <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                    <code className="text-xs flex-1 break-all">
                      {cryptoPaymentData.pay_address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(cryptoPaymentData.pay_address)}
                      className="shrink-0"
                    >
                      {addressCopied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Waiting Message */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('waiting_for_payment')}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreditAlertSettings open={showCreditAlertDialog} onOpenChange={setShowCreditAlertDialog} />
    </div>
  );
}

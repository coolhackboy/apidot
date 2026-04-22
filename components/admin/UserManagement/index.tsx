'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  userManagementService,
  AdminUser,
  ListUsersParams,
} from '@/services/userManagementService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  ChevronDown,
  Plus,
  Users,
  Mail,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { appConfig } from '@/data/config';
import AddCreditsDialog from './AddCreditsDialog';
import BatchAddCreditsDialog from './BatchAddCreditsDialog';
import UserHistoryDialog from './UserHistoryDialog';
import RateLimitDialog from './RateLimitDialog';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  free: { label: '免费用户', variant: 'secondary' },
  onepay: { label: '一次性用户', variant: 'default' },
  month: { label: '月付用户', variant: 'default' },
  year: { label: '年付用户', variant: 'default' },
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const WELCOME_EMAIL = {
  subject: 'Welcome to PoYo API — Free Credits Inside',
  html: `<p>Hey,</p>
<p>Thanks for signing up for PoYo API!</p>
<br>
<p>We provide unified API access to top AI models including Sora, Nano Banana Pro, Suno, and more — with simple pricing and easy integration.</p>
<br>
<p>To get you started, we've added some free credits to your account so you can test the API right away.</p>
<br>
<p>Here are some resources to help:</p>
<ul>
<li><a href="https://docs.poyo.ai">API Documentation</a></li>
<li><a href="https://poyo.ai/dashboard/api-keys">Get your API Key</a></li>
<li><a href="https://poyo.ai/models">Explore Available Models</a></li>
</ul>
<br>
<p>If you have any questions or need help, visit our <a href="https://poyo.ai/support">Support Page</a> — we're available on Discord, Telegram, and Email.</p>
<br>
<p>Best,</p>
<p>Ronny</p>`,
};

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states
  const [filterEmail, setFilterEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Dialog states
  const [showAddCreditsDialog, setShowAddCreditsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Batch selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [showBatchAddCreditsDialog, setShowBatchAddCreditsDialog] = useState(false);

  // History dialog states
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);

  // Rate limit dialog states
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimitUser, setRateLimitUser] = useState<AdminUser | null>(null);

  // Welcome email state
  const [sendingEmailUserId, setSendingEmailUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedUserIds(new Set()); // Clear selection on refresh
      const params: ListUsersParams = {
        page,
        page_size: pageSize,
      };
      if (searchKeyword.trim()) {
        params.user_name = searchKeyword.trim();
      }
      if (filterEmail.trim()) {
        params.email = filterEmail.trim();
      }
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await userManagementService.listUsers(params);
      setUsers(response?.items || []);
      setTotal(response?.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchKeyword, filterEmail, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`已复制${label}: ${text}`);
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  const handleAddCredits = (user: AdminUser) => {
    setSelectedUser(user);
    setShowAddCreditsDialog(true);
  };

  const handleAddCreditsDialogClose = (saved: boolean) => {
    setShowAddCreditsDialog(false);
    setSelectedUser(null);
    if (saved) {
      fetchUsers();
    }
  };

  const handleViewHistory = (user: AdminUser) => {
    setHistoryUser(user);
    setShowHistoryDialog(true);
  };

  const handleResetFilters = () => {
    setFilterEmail('');
    setFilterStatus('');
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchUsers();
  };

  const handleSendWelcomeEmail = async (user: AdminUser) => {
    setSendingEmailUserId(user.uid);
    try {
      const result = await apiService.sendEmail({
        to: [user.email],
        subject: WELCOME_EMAIL.subject,
        html: WELCOME_EMAIL.html,
      });
      if (result.code === 200) {
        toast.success(`欢迎邮件已发送至 ${user.email}`);
      } else {
        toast.error('邮件发送失败');
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('邮件发送失败，请检查网络连接');
    } finally {
      setSendingEmailUserId(null);
    }
  };

  // Batch selection handlers
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allIds = new Set(users.map(u => u.uid));
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (uid: number, checked: boolean | 'indeterminate') => {
    const newSet = new Set(selectedUserIds);
    if (checked === true) {
      newSet.add(uid);
    } else {
      newSet.delete(uid);
    }
    setSelectedUserIds(newSet);
  };

  const selectedUsers = users.filter(u => selectedUserIds.has(u.uid));
  const isAllSelected = users.length > 0 && users.every(u => selectedUserIds.has(u.uid));
  const isPartialSelected = selectedUserIds.size > 0 && !isAllSelected;

  const handleBatchAddCreditsDialogClose = (saved: boolean) => {
    setShowBatchAddCreditsDialog(false);
    if (saved) {
      setSelectedUserIds(new Set());
      fetchUsers();
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="w-full px-4 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">用户管理</CardTitle>
              <CardDescription className="mt-1">
                查看和管理平台用户，包括积分管理功能
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchUsers()}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              {selectedUserIds.size > 0 && (
                <div className="flex items-center gap-2 ml-2 pl-4 border-l">
                  <span className="text-sm text-muted-foreground">
                    已选中 {selectedUserIds.size} 个用户
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowBatchAddCreditsDialog(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    批量添加积分
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUserIds(new Set())}
                  >
                    清除选择
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索用户名"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-64"
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Collapsible open={filterOpen} onOpenChange={setFilterOpen} className="mb-6">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="mb-4">
                <Filter className="mr-2 h-4 w-4" />
                筛选
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">邮箱</label>
                    <Input
                      placeholder="输入用户邮箱"
                      value={filterEmail}
                      onChange={(e) => setFilterEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">状态</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="free">免费用户</SelectItem>
                        <SelectItem value="onepay">一次性用户</SelectItem>
                        <SelectItem value="month">月付用户</SelectItem>
                        <SelectItem value="year">年付用户</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="outline" onClick={handleResetFilters}>
                      重置
                    </Button>
                    <Button onClick={handleApplyFilters}>
                      应用筛选
                    </Button>
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Table */}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无用户数据</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isPartialSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-xs">用户ID</TableHead>
                      <TableHead className="text-xs">用户名</TableHead>
                      <TableHead className="text-xs">邮箱</TableHead>
                      <TableHead className="text-xs text-center">状态</TableHead>
                      <TableHead className="text-xs text-right">积分余额</TableHead>
                      <TableHead className="text-xs">创建时间</TableHead>
                      <TableHead className="text-xs">最后登录</TableHead>
                      <TableHead className="text-xs">最后登录IP</TableHead>
                      <TableHead className="text-xs">来源</TableHead>
                      <TableHead className="text-xs">内部来源</TableHead>
                      <TableHead className="text-xs text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.uid)}
                            onCheckedChange={(checked) => handleSelectUser(user.uid, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-xs">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-xs text-primary hover:underline"
                            onClick={() => handleViewHistory(user)}
                          >
                            {user.uid}
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs">{user.user_name || '-'}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <span className="max-w-[200px] truncate">{user.email}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyToClipboard(user.email, '邮箱')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>复制邮箱</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={STATUS_CONFIG[user.status]?.variant || 'secondary'}>
                            {STATUS_CONFIG[user.status]?.label || user.status || '未知'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {user.credits_amount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(user.created_time)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(user.last_login_time)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <span>{user.last_login_ip || '-'}</span>
                            {user.country && (
                              <Badge variant="outline" className="text-xs">
                                {user.country}
                              </Badge>
                            )}
                            {user.last_login_ip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopyToClipboard(user.last_login_ip, 'IP')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>复制IP</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {user.source || '-'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate cursor-default">
                                {user.internal_source || '-'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{user.internal_source || '-'}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleAddCredits(user)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              添加积分
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => {
                                setRateLimitUser(user);
                                setShowRateLimitDialog(true);
                              }}
                            >
                              限流设置
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              disabled={sendingEmailUserId === user.uid}
                              onClick={() => handleSendWelcomeEmail(user)}
                            >
                              {sendingEmailUserId === user.uid ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="mr-1 h-3 w-3" />
                              )}
                              欢迎邮件
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          )}

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                显示第 {startIndex} 条 - 第 {endIndex} 条，共 {total} 条
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">总页数: {totalPages}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">{page}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页条数:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Credits Dialog */}
      <AddCreditsDialog
        open={showAddCreditsDialog}
        onClose={handleAddCreditsDialogClose}
        user={selectedUser}
      />

      {/* Batch Add Credits Dialog */}
      <BatchAddCreditsDialog
        open={showBatchAddCreditsDialog}
        onClose={handleBatchAddCreditsDialogClose}
        users={selectedUsers}
      />

      {/* User History Dialog */}
      <UserHistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        user={historyUser}
      />

      {/* Rate Limit Dialog */}
      <RateLimitDialog
        user={rateLimitUser}
        open={showRateLimitDialog}
        onOpenChange={setShowRateLimitDialog}
        onSuccess={() => {
          fetchUsers();
          setRateLimitUser(null);
        }}
      />
    </div>
  );
}

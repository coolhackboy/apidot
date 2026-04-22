'use client';

import { useState } from "react";
import { apiService } from '@/services/api';
import { appConfig } from '@/data/config';
import { Crown, Check, Loader2 } from "lucide-react";
import LoginForm from '@/components/auth/LoginForm';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PricingClientProps {
  title?: string;
  subtitle?: string;
  showFreePlan?: boolean;
  translations?: {
    hero?: {
      title: string;
      description: string;
    };
    plans?: any[];
  };
  className?: string;
  compact?: boolean;
}

export default function PricingClient({ 
  title, 
  subtitle, 
  showFreePlan = false,
  translations,
  className,
  compact = false
}: PricingClientProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'month' | 'year' | 'onetime'>('onetime');

  const appName = appConfig.appName;
  const displayTitle = translations?.hero?.title || title;
  const displaySubtitle = translations?.hero?.description || subtitle;
  const plans = translations?.plans || [];

  const handleSubscribe = async (plan: any) => {
    if (!apiService.isLoggedInToApp(appName)) {
      setPendingPlan(plan);
      setShowLoginModal(true);
      return;
    }
    
    setLoading({ ...loading, [plan.code]: true });
    
    try {
      const result = await apiService.createCheckoutSession({
        plan_code: plan.code,
        frontend_url: window.location.href
      }, appName as string);

      if (result.code === 200) {
        const { url, order_no } = result.data;
        const payWindow = window.open(url, '_blank');
        
        const checkPaymentStatus = setInterval(async () => {
          if (payWindow?.closed) {
            clearInterval(checkPaymentStatus);
            setLoading({ ...loading, [plan.code]: false });
            return;
          }
          
          try {
            const statusResult = await apiService.checkPaymentStatus(order_no, appName as string);
            
            if (statusResult.code === 200 && statusResult.data.status === 'completed') {
              clearInterval(checkPaymentStatus);
              payWindow?.close();
              toast.success('Payment successful!');
              setLoading({ ...loading, [plan.code]: false });
            }
          } catch (error) {
            console.error('Check payment status error:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setLoading({ ...loading, [plan.code]: false });
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingPlan) {
      handleSubscribe(pendingPlan);
      setPendingPlan(null);
    }
  };

  return (
    <div className={cn(
      "min-h-screen",
      compact && "min-h-0",
      className
    )}>
      {/* Login Modal */}
      <LoginForm
        app_name={appName}
        onLoginSuccess={handleLoginSuccess}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
      

      {/* Pricing Section */}
      <div className={cn(
        "max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:px-6 lg:px-8",
        compact && "py-8"
      )}>
        <div className="text-center">
          <h1 className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight sm:text-4xl px-2",
            compact && "text-xl sm:text-2xl sm:text-3xl"
          )}>
            {displayTitle}
          </h1>
          <div className="mt-4 flex flex-col items-center space-y-4 px-2">
            <p className={cn(
              "text-sm sm:text-lg text-muted-foreground",
              compact && "text-sm sm:text-base"
            )}>
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div id="pricing-plans" className="mt-8 sm:mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:gap-6 lg:max-w-7xl lg:mx-auto px-2">
          <div className={cn(
            "grid gap-4 sm:gap-6",
            plans.filter((plan: any) => {
              // 排除免费计划，只显示一次性付款
              if (plan.plan_interval === 'free' || plan.type === 'free') return false;
              return plan.type === 'onepay';
            }).length === 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-[900px] mx-auto"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
          )}>
            {plans
              .filter((plan: any) => {
                // 排除免费计划，只显示一次性付款
                if (plan.plan_interval === 'free' || plan.type === 'free') return false;
                return plan.type === 'onepay';
              })
              .map((plan: any) => {
              const displayPrice = paymentType === 'onetime' 
                ? parseFloat(plan.price)
                : plan.plan_interval === 'year' 
                  ? (parseFloat(plan.price) / 12).toFixed(2)
                  : parseFloat(plan.price);

              return (
                <Card
                  key={plan.code}
                  className={cn(
                    "relative transform transition-all duration-300 hover:scale-105",
                    plan.popular && "border-2 border-primary shadow-xl shadow-primary/10",
                    plan.plan_interval !== 'free' && "bg-muted/50"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-0 right-0 flex justify-center">
                      <span className="bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-medium shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      {plan.name}
                      {plan.popular && (
                        <Badge variant="default" className="ml-2">
                          <Crown className="h-4 w-4 mr-1" />
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${displayPrice}</span>
                      <span className="text-muted-foreground">
                        {paymentType === 'onetime' ? '/one-time' : '/month'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.plan_interval !== 'free' && plan.type !== 'free' && (
                      <Button
                        className="w-full mb-6 bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] hover:from-[hsl(var(--primary))] hover:to-[hsl(var(--gradient-end))] text-primary-foreground font-semibold rounded-full py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                        onClick={() => handleSubscribe(plan)}
                        disabled={loading[plan.code]}
                      >
                        {loading[plan.code] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🔥</span>
                            {paymentType === 'onetime' ? 'Buy Now' : 'Subscribe'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    <ul className="space-y-4">
                      {plan.features.map((feature: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className={cn(
                            "ml-3 text-muted-foreground",
                            feature.isBold && "font-medium text-foreground"
                          )}>
                            {feature.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
 
        
        {/* Payment Methods */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <div className="text-sm sm:text-base text-muted-foreground mb-4">Secure Payment:</div>
          <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
            <img src="/icon/mastercard.png" alt="Mastercard" className="h-6 sm:h-8" />
            <img src="/icon/visa.png" alt="Visa" className="h-6 sm:h-8" />
            <img src="/icon/american-express.png" alt="American Express" className="h-6 sm:h-8" />
            <img src="/icon/apple-pay.png" alt="Apple Pay" className="h-6 sm:h-8" />
            <img src="/icon/union-pay.png" alt="Union Pay" className="h-6 sm:h-8" />
            <span className="text-sm sm:text-base text-muted-foreground">More &gt;&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
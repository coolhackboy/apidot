import { redirect } from "next/navigation";

type PageProps = {
  params: {
    locale: string;
  };
};

export default function ApiUsageRedirectPage({ params }: PageProps) {
  redirect(params.locale === "en" ? "/dashboard" : `/${params.locale}/dashboard`);
}

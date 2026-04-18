import { redirect } from "next/navigation";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirigir a la página de hoteles
  redirect(`/${locale}/hotels`);
}

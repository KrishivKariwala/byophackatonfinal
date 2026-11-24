import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="display text-5xl text-tomato">{t("err.notFoundTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("err.notFoundBody")}</p>
      <Link href="/" className="btn-primary mt-6">{t("err.goHome")}</Link>
    </div>
  );
}

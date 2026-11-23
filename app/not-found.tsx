import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="display text-5xl text-tomato">NOT FOUND</h1>
      <p className="mt-2 text-sm text-muted">This page or item doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}

import { PublicHeader, PublicFooter } from "@/components/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </>
  );
}

import MainLayoutGate from "@/components/auth/MainLayoutGate";

export default function MainSegmentLayout({ children }: { children: React.ReactNode }) {
  return <MainLayoutGate>{children}</MainLayoutGate>;
}

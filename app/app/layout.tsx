import { Diagnostics } from "./Diagnostics";

export default function SignedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Diagnostics />
      {children}
    </>
  );
}

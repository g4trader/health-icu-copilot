import "./iatron-fut.css";
import { IatronFutBodyClass } from "@/components/IatronFutBodyClass";

export default function IatronFutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IatronFutBodyClass />
      <div className="iatron-fut">{children}</div>
    </>
  );
}

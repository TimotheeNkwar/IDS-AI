import BackgroundCanva from "../BackgroundCanva";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen  -z-10 flex items-center justify-center">
      <BackgroundCanva />
      <div>{children}</div>
    </div>
  );
}

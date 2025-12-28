import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-black text-white overflow-hidden">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <InteractiveAvatar />
      </div>
    </main>
  );
}
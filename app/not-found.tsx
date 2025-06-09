import Link from "next/link";
import Image from "next/image";
import BgImage from "@/components/BgImage";
import { Button } from "@/components/buttons/Buttons";

export default function NotFound() {
  return (
    <div className="flex items-center h-screen">
      <BgImage />
      <div className="bg-main-lighter flex w-[750px] rounded-xl shadow-lg mx-auto overflow-hidden border-4 border-main-border">
        <Image src="/cat.gif" width={350} height={350} alt="404" />
        <div className="flex flex-col justify-center items-center flex-grow">
          <h2 className="text-6xl font-bold">404</h2>
          <p className="font-semibold">Page not found</p>
          <Button className="mt-10 text-semibold text-lg bg-main">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client"

import dynamic from "next/dynamic";
import CrispCustomization from "./CrispCustomization";

// Dynamically import Crisp chat with no SSR - now in a client component
const CrispWithNoSSR = dynamic(
  () => import('./CrispChat'),
  { ssr: false }
);

export default function CrispProvider() {
  return (
    <>
      <CrispCustomization />
      <CrispWithNoSSR />
    </>
  );
}

"use client";
import ListClient from "./ListClient";
import { useApp } from "./Providers";
import { cn } from "../lib/data";

export default function CategoryTitle({ c, list }) {
  const { lang } = useApp();
  return <ListClient title={cn(lang, c)} products={list} />;
}

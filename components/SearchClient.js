"use client";
import { useSearchParams } from "next/navigation";
import ListClient from "./ListClient";
import { useApp } from "./Providers";
import { products } from "../lib/data";

export default function SearchClient() {
  const q = (useSearchParams().get("q") || "").trim();
  const { t } = useApp();
  return <ListClient title={`${t("results")} “${q}”`} products={products} query={q} />;
}

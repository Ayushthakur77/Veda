"use client";
import ListClient from "./ListClient";
import { useApp } from "./Providers";

export default function SearchTitle({ q, list }) {
  const { t } = useApp();
  return <ListClient title={`${t("results")} \u201C${q}\u201D`} products={list} />;
}

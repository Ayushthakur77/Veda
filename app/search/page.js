import ListClient from "../../components/ListClient";
import SearchTitle from "../../components/SearchTitle";
import { getProducts } from "../../lib/catalog";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }) {
  const q = String(searchParams?.q ?? "").trim().slice(0, 80);
  const list = q ? await getProducts({ q }) : [];
  return <SearchTitle q={q} list={list} />;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";

export default function TaskSearch({
  id = "task-search",
  placeholder = "Search title or tag",
  label = "Search tasks",
}: {
  id?: string;
  placeholder?: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="position-relative" style={{ maxWidth: 260 }}>
      <FiSearch className="position-absolute text-muted" style={{ left: 10, top: 10 }} />
      <input
        id={id}
        name="q"
        type="search"
        className="form-control form-control-sm ps-4"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={label}
      />
      {value && (
        <button
          type="button"
          className="btn btn-sm border-0 position-absolute"
          style={{ right: 2, top: 0 }}
          onClick={() => setValue("")}
          aria-label="Clear search"
        >
          <FiX />
        </button>
      )}
    </div>
  );
}

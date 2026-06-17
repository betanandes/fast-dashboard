import { useState, useEffect } from "react";

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar");
    return saved === "collapsed";
  });

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  return { collapsed, toggle: () => setCollapsed((v) => !v) };
}

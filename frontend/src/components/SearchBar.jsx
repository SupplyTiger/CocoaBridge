import { useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";

const SearchBar = ({ onSearch, placeholder = "Search...", className = "" }) => {
  const [search, setSearch] = useState("");
  const timerRef = useRef(null);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  return (
    <label className={`input input-bordered flex items-center gap-2 w-full max-w-sm ${className}`}>
      <Search className="size-4 opacity-50" />
      <input
        type="text"
        placeholder={placeholder}
        className="grow"
        value={search}
        onChange={handleChange}
      />
    </label>
  );
};

export default SearchBar;

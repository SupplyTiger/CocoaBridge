import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";
import Table from "../components/Table.jsx";
import SearchBar from "../components/SearchBar.jsx";

const columns = [
  {
    accessor: "fullName",
    header: "Name",
    render: (val) => val ?? "—",
  },
  {
    accessor: "email",
    header: "Email",
    render: (val) => val ?? "—",
  },
  {
    accessor: "phone",
    header: "Phone",
    render: (val) => val ?? "—",
  },
  {
    accessor: "title",
    header: "Title",
    render: (val) => val ?? "—",
  },
  {
    accessor: "buyingOrg",
    header: "Buying Agency",
    render: (_, row) => row.links?.[0].buyingOrganization?.name ?? "—",
  },
];

const ContactsPage = () => {
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["contacts", page, debouncedSearch],
    queryFn: () => dbApi.listContacts({ page, limit: 50, search: debouncedSearch || undefined }),
  });

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        placeholder="Search by name or email..."
        onSearch={(val) => { setDebouncedSearch(val); setPage(1); }}
      />
      <Table
        columns={columns}
        data={result?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        meta={result?.meta}
        page={page}
        onPageChange={setPage}
        basePath="/contacts"
        emptyMessage={debouncedSearch ? "No results found" : "No Contacts"}
        emptySubMessage={debouncedSearch ? `No contacts match "${debouncedSearch}".` : "Contacts will appear here once available."}
      />
    </div>
  );
};

export default ContactsPage;
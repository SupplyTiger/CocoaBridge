import { useState } from 'react'
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";
import Table from "../components/Table.jsx";

// TODO: Link to recipient and agency pages when those are implemented

const columns = [
  { accessor: "title", header: "Title" },
  { accessor: "type", header: "Type" },
    {
    accessor: "pscCode",
    header: "PSC",
    render: (val) => val ?? "—",
  },
  {
    accessor: "naicsCodes",
    header: "NAICS Codes",
    render: (val) => val?.length > 0 ? val.join(", ") : "—",
  },

  {
    accessor: "setAside",
    header: "Set Aside",
    render: (val) => val ?? "—",
  },
  {
    accessor: "responseDeadline",
    header: "Deadline",
    render: (val) => (val ? new Date(val).toLocaleDateString() : "—"),
  },

  {
    accessor: "state",
    header: "State",
    render: (val) => val ?? "—",
  },
  {
    accessor: "active",
    header: "Active",
    render: (val) => (val ? "Yes" : "No"),
  },
];

const Opportunities = () => {
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["opportunities", page],
    queryFn: () => dbApi.listOpportunities({ page, limit: 50 }),
  });

  return (
    <div>
      <Table
        columns={columns}
        data={result?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        meta={result?.meta}
        page={page}
        onPageChange={setPage}
        basePath="/opportunities"
      />
    </div>
  );
};

export default Opportunities;

import { useState } from 'react'
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";
import Table from "../components/Table.jsx";

const columns = [
  {
    accessor: "description",
    header: "Description",
    render: (val) => val && val.length > 60 ? `${val.slice(0, 60)}…` : (val ?? "—"),
  },
  {
    accessor: "obligatedAmount",
    header: "Amount",
    render: (val) => val ? `$${Number(val).toLocaleString()}` : "—",
  },
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
    accessor: "startDate",
    header: "Start",
    render: (val) => val ? new Date(val).toLocaleDateString() : "—",
  },
  {
    accessor: "endDate",
    header: "End",
    render: (val) => val ? new Date(val).toLocaleDateString() : "—",
  },
];

const Awards = () => {
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["awards", page],
    queryFn: () => dbApi.listAwards({ page, limit: 50 }),
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
        basePath="/awards"
      />
    </div>
  );
};

export default Awards;

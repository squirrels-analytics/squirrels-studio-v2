export interface DatasetResultResponse {
  schema: {
    fields: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  };
  total_num_rows: number;
  data_details: {
    orientation: "rows";
    [key: string]: unknown;
  };
  data: unknown[][];
}


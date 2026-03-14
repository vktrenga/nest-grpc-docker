export interface GetOrdersDto {
  page?: number;         // current page
  limit?: number;        // items per page
  status?: string;       // optional filter by order status
  startDate?: string;    // optional filter start date (ISO)
  endDate?: string;      // optional filter end date (ISO)
  userId?: string;   
}
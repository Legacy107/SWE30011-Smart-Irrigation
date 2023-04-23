import { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  styled,
  tableCellClasses,
} from '@mui/material'
import { SensorData } from '@/@types/sensorData'
import { StatusData } from '@/@types/statusData'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));


interface Column {
  id: 'soilMoisture' | 'temperature' | 'humidity' | 'status' | 'readingTime',
  label: string,
  minWidth?: number,
  align?: 'right',
  format?: (value: string) => string,
}

type TableProps = {
  data: SensorData | null,
  statusData: StatusData | null,
}

const columns: readonly Column[] = [
  { id: 'soilMoisture', label: 'Soil Moisture', minWidth: 50 },
  { id: 'temperature', label: 'Temperature', minWidth: 50 },
  { id: 'humidity', label: 'Humidity', minWidth: 50 },
  { id: 'status', label: 'Status', minWidth: 50 },
  {
    id: 'readingTime',
    label: 'Reading Time',
    minWidth: 100,
    format: (value: string) => new Date(value).toLocaleString(),
  },
]

export default function DataTable({ data, statusData }: TableProps) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // combine data and statusData into a single array grouping by readingTime
  const rows = statusData?.map((status, index) => ({
    soilMoisture: data?.soilMoisture?.[index]?.reading,
    temperature: data?.temperature?.[index]?.reading,
    humidity: data?.humidity?.[index]?.reading,
    ...status,
  })) || []

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  return (
    <Paper sx={{
      width: 'min(800px, calc(100% - 2rem))',
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: '2rem',
    }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <StyledTableRow>
              {columns.map((column) => (
                <StyledTableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </StyledTableCell>
              ))}
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <StyledTableRow hover role="checkbox" tabIndex={-1} key={row.readingTime}>
                    {columns.map((column) => {
                      const value = row[column.id]
                      return (
                        <StyledTableCell key={column.id} align={column.align}>
                          { column.format && typeof value === 'string'
                            ? column.format(value)
                            : value
                          }
                        </StyledTableCell>
                      )
                    })}
                  </StyledTableRow>
                )
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

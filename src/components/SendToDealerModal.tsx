import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

interface AmountDetail {
  kept: string;
}

interface EntryItem {
  _id: string;
  number: string;
  top2?: AmountDetail;
  bottom2?: AmountDetail;
  source: "self" | "dealer";
}

interface Props {
  entries: EntryItem[];
}

export default function SendToDealerModal({ entries }: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filtered = entries.filter(
    (e) => e.source === "self" && (e.top2 || e.bottom2)
  );

  const totalKept = (field: "top2" | "bottom2") =>
    filtered.reduce((acc, item) => {
      const value = item[field]?.kept;
      return acc + (value ? parseFloat(value) : 0);
    }, 0);

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="contained"
        color="secondary"
        className="mb-4"
      >
        📩 ส่งให้เจ้ามือหวย
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>รายการที่ส่งให้เจ้ามือหวย</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">เลข</TableCell>
                <TableCell align="center">2 ตัวบน (kept)</TableCell>
                <TableCell align="center">2 ตัวล่าง (kept)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">{item.top2?.kept || "-"}</TableCell>
                  <TableCell align="center">
                    {item.bottom2?.kept || "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell align="right" style={{ fontWeight: "bold" }}>
                  รวม
                </TableCell>
                <TableCell align="center" style={{ fontWeight: "bold" }}>
                  {totalKept("top2").toLocaleString()}
                </TableCell>
                <TableCell align="center" style={{ fontWeight: "bold" }}>
                  {totalKept("bottom2").toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

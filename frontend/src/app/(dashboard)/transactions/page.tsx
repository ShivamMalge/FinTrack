'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, Receipt, Trash2, FileSpreadsheet, FileDown } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ type: 'ALL', categoryId: 'ALL', from: '', to: '' });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data
  });

  const queryParams = new URLSearchParams();
  if (filters.type !== 'ALL') queryParams.append('type', filters.type);
  if (filters.categoryId !== 'ALL') queryParams.append('categoryId', filters.categoryId);
  if (filters.from) queryParams.append('startDate', filters.from);
  if (filters.to) queryParams.append('endDate', filters.to);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => (await api.get(`/transactions?${queryParams.toString()}`)).data.data
  });

  const txs = data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Transaction deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete transaction');
    }
  });

  const exportUrlCsv = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/transactions/export?format=csv&${queryParams.toString()}`;
  const exportUrlExcel = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/transactions/export?format=xlsx&${queryParams.toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <a href={exportUrlCsv} className={buttonVariants({ variant: 'outline' })}>
            <FileDown className="mr-2 h-4 w-4" /> CSV
          </a>
          <a href={exportUrlExcel} className={buttonVariants({ variant: 'outline' })}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </a>
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/4">
          <Label>Type</Label>
          <Select value={filters.type} onValueChange={(val) => { if (val) setFilters(f => ({ ...f, type: val })); }}>
            <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/4">
          <Label>Category</Label>
          <Select value={filters.categoryId} onValueChange={(val) => { if (val) setFilters(f => ({ ...f, categoryId: val })); }}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/4">
          <Label>From Date</Label>
          <Input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </div>
        <div className="w-full md:w-1/4">
          <Label>To Date</Label>
          <Input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell>{tx.category?.name}</TableCell>
                      <TableCell>{tx.note}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(tx.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {txs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8">
                        <EmptyState icon={Receipt} title="No transactions" description="Adjust your filters or add a new transaction." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="md:hidden space-y-4">
            {txs.map((tx: any) => (
              <Card key={tx.id} className="p-4 flex flex-col space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{tx.category?.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                  </div>
                </div>
                {tx.note && <div className="text-sm text-gray-500">{tx.note}</div>}
                <div className="flex justify-end pt-2 border-t mt-2">
                   <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(tx.id)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4 mr-2" /> Delete
                   </Button>
                </div>
              </Card>
            ))}
            {txs.length === 0 && (
               <Card className="p-4">
                 <EmptyState icon={Receipt} title="No transactions" description="Adjust your filters or add a new transaction." />
               </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

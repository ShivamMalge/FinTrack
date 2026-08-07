'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', type: 'EXPENSE', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });

  const { data: summary } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => (await api.get('/summary')).data.data
  });

  const { data: txs = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get('/transactions')).data.data
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/transactions', { ...data, amount: parseFloat(data.amount), date: `${data.date}T00:00:00Z` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setIsOpen(false);
      setFormData({ amount: '', type: 'EXPENSE', categoryId: '', note: '', date: new Date().toISOString().split('T')[0] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    }
  });

  const filteredCategories = categories.filter((c: any) => c.type === formData.type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.location.href='/api/transactions/export?format=csv'}>Export CSV</Button>
          <Button onClick={() => setIsOpen(true)}>Add Transaction</Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(val: string | null) => { if (val) setFormData({...formData, type: val, categoryId: ''}) }}>
                    <SelectTrigger>{formData.type === 'INCOME' ? 'Income' : 'Expense'}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Income</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.categoryId} onValueChange={(val: string | null) => { if (val) setFormData({...formData, categoryId: val}) }}>
                    <SelectTrigger>
                      {categories.find((c: any) => c.id === formData.categoryId)?.name || "Select category"}
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note (Optional)</Label>
                  <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || !formData.categoryId}>
                  Save Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${summary?.totalIncome || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">${summary?.totalExpense || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Net Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${summary?.balance || 0}</div></CardContent>
        </Card>
      </div>

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
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(tx.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

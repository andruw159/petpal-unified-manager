import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transaction_type: 'sale' | 'purchase';
  client_name: string;
  product: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

interface TransactionEditDialogProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionEditDialog({
  transaction,
  open,
  onClose,
  onSuccess,
}: TransactionEditDialogProps) {
  const [formData, setFormData] = useState({
    client_name: transaction.client_name,
    product: transaction.product,
    quantity: transaction.quantity,
    unit_price: transaction.unit_price,
    payment_method: transaction.payment_method,
    notes: transaction.notes || '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const total = formData.quantity * formData.unit_price;
      
      const { error } = await supabase
        .from('transactions')
        .update({
          client_name: formData.client_name,
          product: formData.product,
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          total,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Transacción actualizada correctamente',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la transacción',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculatedTotal = formData.quantity * formData.unit_price;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Transacción</DialogTitle>
            <DialogDescription>
              Modifica los datos de la transacción pendiente. Los cambios deben ser confirmados.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product">Producto</Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => handleChange('product', e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit_price">Precio Unitario</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment">Método de Pago</Label>
              <Input
                id="payment"
                value={formData.payment_method}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                placeholder="Ej: Efectivo, Tarjeta, Transferencia"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Calculado:</span>
                <span className="text-2xl font-bold">${calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => setShowConfirm(true)} disabled={loading}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas actualizar esta transacción? Esta acción modificará los datos de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

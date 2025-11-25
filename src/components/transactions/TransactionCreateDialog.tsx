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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface TransactionCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionCreateDialog({
  open,
  onClose,
  onSuccess,
}: TransactionCreateDialogProps) {
  const [formData, setFormData] = useState({
    transaction_type: 'sale' as 'sale' | 'purchase',
    client_name: '',
    product: '',
    quantity: 1,
    unit_price: 0,
    payment_method: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name || !formData.product || !formData.payment_method) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para crear transacciones',
          variant: 'destructive',
        });
        return;
      }

      const total = formData.quantity * formData.unit_price;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_type: formData.transaction_type,
        client_name: formData.client_name,
        product: formData.product,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Transacción creada correctamente',
      });

      setFormData({
        transaction_type: 'sale',
        client_name: '',
        product: '',
        quantity: 1,
        unit_price: 0,
        payment_method: '',
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la transacción',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculatedTotal = formData.quantity * formData.unit_price;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra una nueva venta o compra en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Transacción</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) =>
                  handleChange('transaction_type', value)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client">Cliente / Proveedor</Label>
              <Input
                id="client"
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                placeholder="Nombre del cliente o proveedor"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product">Producto</Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => handleChange('product', e.target.value)}
                placeholder="Nombre del producto"
                required
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
                  onChange={(e) =>
                    handleChange('quantity', parseInt(e.target.value) || 1)
                  }
                  required
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
                  onChange={(e) =>
                    handleChange('unit_price', parseFloat(e.target.value) || 0)
                  }
                  required
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
                required
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
                <span className="text-2xl font-bold">
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Transacción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
